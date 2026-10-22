<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

/** Ingredient priced at R$ 10/kg. */
function orderTestIngredient(): Ingredient
{
    return Ingredient::create([
        'name' => 'Frango',
        'category' => 'Proteína',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
}

/** A recipe owned by the pet, feeding `$dailyKg` kg of the ingredient per day. */
function orderTestRecipe(Pet $pet, Ingredient $ingredient, string $name = 'Recipe A', float $dailyKg = 0.5, array $attributes = []): Recipe
{
    $recipe = Recipe::create($attributes + [
        'user_id' => $pet->user_id,
        'pet_id' => $pet->id,
        'name' => $name,
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => false,
        'base_cost' => 0,
        'ingredient_cost' => 0,
        'is_active' => true,
    ]);
    $recipe->ingredients()->attach($ingredient->id, ['quantity' => $dailyKg, 'unit' => 'kg']);

    return $recipe;
}

/** A customer with one pet. */
function orderTestPet(?User $user = null, string $name = 'Rex'): Pet
{
    $user ??= User::factory()->create();

    return Pet::create(['user_id' => $user->id, 'name' => $name, 'type' => 'dog']);
}

test('customer can create an order and then list and view it', function () {
    $pet = orderTestPet();
    $recipe = orderTestRecipe($pet, orderTestIngredient());

    $created = $this->actingAs($pet->user)->postJson('/api/orders', [
        'items' => [['recipe_id' => $recipe->id, 'pet_id' => $pet->id, 'duration_days' => 15]],
    ])->assertStatus(201);

    $orderId = $created->json('data.id');
    expect($orderId)->not->toBeNull();

    // Regression: index/show used to eager-load a removed 'subscription'
    // relation and would 500 here.
    $this->actingAs($pet->user)->getJson('/api/orders')->assertStatus(200);
    $this->actingAs($pet->user)->getJson("/api/orders/{$orderId}")
        ->assertStatus(200)
        ->assertJsonPath('data.items.0.duration_days', 15)
        ->assertJsonPath('data.items.0.position', 1);
});

test('a meal plan prices every recipe for its own duration and keeps the sequence per pet', function () {
    $user = User::factory()->create();
    $rex = orderTestPet($user, 'Rex');
    $luna = orderTestPet($user, 'Luna');
    $ingredient = orderTestIngredient();
    $chicken = orderTestRecipe($rex, $ingredient, 'Chicken');
    $beef = orderTestRecipe($rex, $ingredient, 'Beef', 0.25);
    $fish = orderTestRecipe($luna, $ingredient, 'Fish');

    $response = $this->actingAs($user)->postJson('/api/orders', [
        'items' => [
            ['pet_id' => $rex->id, 'recipe_id' => $chicken->id, 'duration_days' => 15],
            ['pet_id' => $luna->id, 'recipe_id' => $fish->id, 'duration_days' => 30],
            ['pet_id' => $rex->id, 'recipe_id' => $beef->id, 'duration_days' => 30],
        ],
    ])->assertStatus(201)->assertJsonCount(3, 'data.items');

    $items = OrderItem::where('order_id', $response->json('data.id'))->get();
    $rexPlan = $items->where('pet_id', $rex->id)->sortBy('position')->values();

    expect($rexPlan->pluck('recipe_id')->all())->toBe([$chicken->id, $beef->id])
        ->and($rexPlan->pluck('position')->all())->toBe([1, 2])
        ->and($rexPlan->pluck('duration_days')->all())->toBe([15, 30])
        ->and($items->firstWhere('pet_id', $luna->id)->position)->toBe(1);

    foreach ($items as $item) {
        $expected = round($item->recipe->load('ingredients')->calculateTotalCost($item->duration_days), 2);
        expect((float) $item->unit_price)->toBe($expected);
    }

    expect((float) $response->json('data.total_price'))->toBe(round((float) $items->sum('unit_price'), 2));
});

test('a longer duration costs more than a shorter one for the same recipe', function () {
    $pet = orderTestPet();
    $recipe = orderTestRecipe($pet, orderTestIngredient());

    $price = fn (int $days) => (float) $this->actingAs($pet->user)->postJson('/api/orders', [
        'items' => [['pet_id' => $pet->id, 'recipe_id' => $recipe->id, 'duration_days' => $days]],
    ])->assertStatus(201)->json('data.total_price');

    expect($price(30))->toBeGreaterThan($price(15));
});

test('order pricing reflects the ingredient price at the moment of creation, live', function () {
    $pet = orderTestPet();
    // Deliberately stale cached value the order must NOT use.
    $recipe = orderTestRecipe($pet, orderTestIngredient(), attributes: ['base_cost' => 999, 'ingredient_cost' => 999]);

    $response = $this->actingAs($pet->user)->postJson('/api/orders', [
        'items' => [['recipe_id' => $recipe->id, 'pet_id' => $pet->id, 'duration_days' => 14]],
    ])->assertStatus(201);

    expect((float) $response->json('data.total_price'))->not->toBe(999.0);
});

test('order items require a pet, a recipe and a duration between 7 and 90 days', function (array $item, string $error) {
    $pet = orderTestPet();
    $recipe = orderTestRecipe($pet, orderTestIngredient());
    $payload = $item + ['pet_id' => $pet->id, 'recipe_id' => $recipe->id, 'duration_days' => 15];

    $this->actingAs($pet->user)->postJson('/api/orders', ['items' => [array_filter($payload, fn ($v) => $v !== null)]])
        ->assertStatus(422)
        ->assertJsonValidationErrors($error);
})->with([
    'no pet' => [['pet_id' => null], 'items.0.pet_id'],
    'no duration' => [['duration_days' => null], 'items.0.duration_days'],
    'too short' => [['duration_days' => 6], 'items.0.duration_days'],
    'too long' => [['duration_days' => 91], 'items.0.duration_days'],
]);

test('an order needs at least one item', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/orders', ['items' => []])
        ->assertStatus(422)
        ->assertJsonValidationErrors('items');
});

test('the recipe of an item must belong to that item\'s pet', function () {
    $user = User::factory()->create();
    $rex = orderTestPet($user, 'Rex');
    $luna = orderTestPet($user, 'Luna');
    $ingredient = orderTestIngredient();
    $lunaRecipe = orderTestRecipe($luna, $ingredient);
    $template = orderTestRecipe($rex, $ingredient, 'Template', attributes: ['pet_id' => null, 'user_id' => null, 'is_template' => true]);

    foreach ([$lunaRecipe, $template] as $recipe) {
        $this->actingAs($user)->postJson('/api/orders', [
            'items' => [['pet_id' => $rex->id, 'recipe_id' => $recipe->id, 'duration_days' => 15]],
        ])->assertStatus(422)->assertJsonValidationErrors('items.0.recipe_id');
    }

    expect(Order::count())->toBe(0);
});

test('a duration must feed the recipe\'s minimum total weight', function () {
    $pet = orderTestPet();
    // 0.1 kg/day reaches the 1.5 kg minimum only after 15 days.
    $recipe = orderTestRecipe($pet, orderTestIngredient(), dailyKg: 0.1);

    $order = fn (int $days) => $this->actingAs($pet->user)->postJson('/api/orders', [
        'items' => [['pet_id' => $pet->id, 'recipe_id' => $recipe->id, 'duration_days' => $days]],
    ]);

    $order(14)->assertStatus(422)->assertJsonValidationErrors('items.0.duration_days');
    $order(15)->assertStatus(201);
});

test('a customer cannot order for another customer\'s pet', function () {
    $owner = orderTestPet();
    $recipe = orderTestRecipe($owner, orderTestIngredient());
    $intruder = User::factory()->create();

    $this->actingAs($intruder)->postJson('/api/orders', [
        'items' => [['pet_id' => $owner->id, 'recipe_id' => $recipe->id, 'duration_days' => 15]],
    ])->assertStatus(403);

    expect(Order::count())->toBe(0);
});

test('customers list only their own orders', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();
    Order::create(['user_id' => $customer->id, 'total_price' => 10, 'status' => 'pending_payment']);
    Order::create(['user_id' => $other->id, 'total_price' => 20, 'status' => 'pending_payment']);

    $this->actingAs($customer)->getJson('/api/orders')->assertStatus(200)->assertJsonCount(1, 'data');
});

test('a customer can update delivery fields but not the status', function () {
    $customer = User::factory()->create();
    $order = Order::create(['user_id' => $customer->id, 'total_price' => 10, 'status' => 'pending_payment']);

    $this->actingAs($customer)->putJson("/api/orders/{$order->id}", [
        'delivery_address' => 'Rua X, 100',
        'status' => 'delivered',
    ])->assertStatus(200);

    $fresh = $order->fresh();
    expect($fresh->delivery_address)->toBe('Rua X, 100')->and($fresh->status)->toBe('pending_payment');
});

test('an admin can update the order status and the replenishment date', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();
    $order = Order::create(['user_id' => $customer->id, 'total_price' => 10, 'status' => 'pending_payment']);

    $this->actingAs($admin)->putJson("/api/orders/{$order->id}", [
        'status' => 'in_production',
        'scheduled_reposicao_date' => '2026-12-01',
    ])->assertStatus(200);

    expect($order->fresh()->status)->toBe('in_production');

    $this->actingAs($admin)->putJson("/api/orders/{$order->id}", ['status' => 'bogus'])->assertStatus(422);
});

test('a customer cannot view or update another customer\'s order', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $order = Order::create(['user_id' => $owner->id, 'total_price' => 10, 'status' => 'pending_payment']);

    $this->actingAs($intruder)->getJson("/api/orders/{$order->id}")->assertStatus(403);
    $this->actingAs($intruder)->putJson("/api/orders/{$order->id}", ['delivery_address' => 'x'])->assertStatus(403);
});

test('creating an order generates an invoice due in three days and one item per entry', function () {
    $pet = orderTestPet();
    $recipe = orderTestRecipe($pet, orderTestIngredient());

    $response = $this->actingAs($pet->user)->postJson('/api/orders', [
        'items' => [
            ['recipe_id' => $recipe->id, 'pet_id' => $pet->id, 'duration_days' => 15],
            ['recipe_id' => $recipe->id, 'pet_id' => $pet->id, 'duration_days' => 15],
        ],
    ])->assertStatus(201);

    $response->assertJsonPath('data.status', 'pending_payment')
        ->assertJsonPath('data.invoice.status', 'pending')
        ->assertJsonCount(2, 'data.items')
        ->assertJsonPath('data.invoice.amount', $response->json('data.total_price'));

    expect(Carbon::parse($response->json('data.invoice.due_date'))->toDateString())
        ->toBe(now()->addDays(3)->toDateString());
});
