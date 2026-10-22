<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Create a priced ingredient measured in kg.
 */
function recipeTestIngredient(string $name = 'Frango'): Ingredient
{
    return Ingredient::create([
        'name' => $name,
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
}

/**
 * Build a valid recipe payload heavy enough to pass the minimum-weight rule.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function recipePayload(Ingredient $ingredient, array $overrides = []): array
{
    return $overrides + [
        'name' => 'Frango com legumes',
        'description' => 'Receita balanceada',
        'pet_type' => 'dog',
        'duration_days' => 15,
        'daily_portions' => 2,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.3, 'unit' => 'kg']],
    ];
}

/**
 * Create a pet for a user.
 */
function recipeTestPet(User $owner, string $name = 'Rex'): Pet
{
    return Pet::create(['user_id' => $owner->id, 'name' => $name, 'type' => 'dog']);
}

test('a customer creates a recipe for one of their pets, always private and owned by them', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();
    $pet = recipeTestPet($customer);
    $ingredient = recipeTestIngredient();

    $response = $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, [
        'pet_id' => $pet->id,
        'is_template' => true,
        'user_id' => $other->id,
    ]))->assertStatus(201)->assertJsonPath('data.pet_id', $pet->id);

    $recipe = Recipe::find($response->json('data.id'));
    expect($recipe->user_id)->toBe($customer->id)
        ->and($recipe->pet_id)->toBe($pet->id)
        ->and($recipe->is_template)->toBeFalse()
        ->and($recipe->ingredients)->toHaveCount(1)
        ->and((float) $recipe->base_cost)->toBeGreaterThan(0.0);
});

test('a customer recipe requires one of their own pets', function () {
    $customer = User::factory()->create();
    $foreignPet = recipeTestPet(User::factory()->create(), 'Thor');
    $ingredient = recipeTestIngredient();

    $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient))
        ->assertStatus(422)->assertJsonStructure(['errors' => ['pet_id']]);

    $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, ['pet_id' => $foreignPet->id]))
        ->assertStatus(422)->assertJsonStructure(['errors' => ['pet_id']]);
});

test('a customer recipe below the minimum total weight is rejected', function () {
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    // 0.05 kg/day x 15 days = 0.75 kg < 1.5 kg
    $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, [
        'pet_id' => recipeTestPet($customer)->id,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.05, 'unit' => 'kg']],
    ]))->assertStatus(422)->assertJsonStructure(['errors' => ['ingredients']]);
});

test('the minimum weight rule counts grams and millilitres correctly', function () {
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    // 100 g/day x 15 days = 1.5 kg exactly
    $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, [
        'pet_id' => recipeTestPet($customer)->id,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 100, 'unit' => 'g']],
    ]))->assertStatus(201);
});

test('an admin can create a light template without a pet', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    $response = $this->actingAs($admin)->postJson('/api/recipes', recipePayload($ingredient, [
        'is_template' => true,
        'user_id' => $customer->id,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.01, 'unit' => 'kg']],
    ]))->assertStatus(201);

    $recipe = Recipe::find($response->json('data.id'));
    expect($recipe->is_template)->toBeTrue()
        ->and($recipe->pet_id)->toBeNull()
        ->and($recipe->user_id)->toBe($customer->id);
});

test('an admin can create a recipe for any customer pet', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();
    $pet = recipeTestPet($customer);

    $response = $this->actingAs($admin)->postJson('/api/recipes', recipePayload(recipeTestIngredient(), ['pet_id' => $pet->id]))
        ->assertStatus(201);

    expect(Recipe::find($response->json('data.id'))->user_id)->toBe($customer->id);
});

test('recipe creation validates its fields', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/recipes', [
        'duration_days' => 0,
        'ingredients' => [['id' => 999, 'quantity' => -1]],
    ])->assertStatus(422)
        ->assertJsonStructure(['errors' => ['name', 'pet_id', 'duration_days', 'ingredients.0.id', 'ingredients.0.quantity']]);
});

test('an owner updates a recipe and re-syncs its ingredients, but cannot move it to another pet', function () {
    $customer = User::factory()->create();
    $pet = recipeTestPet($customer);
    $otherPet = recipeTestPet($customer, 'Mel');
    $first = recipeTestIngredient('Frango');
    $second = recipeTestIngredient('Arroz');

    $id = $this->actingAs($customer)->postJson('/api/recipes', recipePayload($first, ['pet_id' => $pet->id]))->json('data.id');

    $this->actingAs($customer)->putJson("/api/recipes/{$id}", [
        'name' => 'Arroz com frango',
        'ingredients' => [['id' => $second->id, 'quantity' => 0.4, 'unit' => 'kg']],
        'pet_id' => $otherPet->id,
    ])->assertStatus(200)->assertJsonPath('data.name', 'Arroz com frango');

    $recipe = Recipe::find($id);
    expect($recipe->ingredients->pluck('id')->all())->toBe([$second->id])
        ->and($recipe->pet_id)->toBe($pet->id);
});

test('a customer lists templates and the recipes of their own pets', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();
    $pet = recipeTestPet($customer);
    $mel = recipeTestPet($customer, 'Mel');
    $foreignPet = recipeTestPet($other, 'Thor');

    Recipe::create(['name' => 'Template', 'pet_type' => 'dog', 'is_template' => true]);
    Recipe::create(['name' => 'Rex food', 'pet_type' => 'dog', 'user_id' => $customer->id, 'pet_id' => $pet->id]);
    Recipe::create(['name' => 'Mel food', 'pet_type' => 'dog', 'user_id' => $customer->id, 'pet_id' => $mel->id]);
    Recipe::create(['name' => 'Hidden', 'pet_type' => 'dog', 'user_id' => $other->id, 'pet_id' => $foreignPet->id]);

    $names = fn (string $url) => collect($this->actingAs($customer)->getJson($url)->assertStatus(200)->json('data'))
        ->pluck('name')->sort()->values()->all();

    expect($names('/api/recipes'))->toBe(['Mel food', 'Rex food', 'Template'])
        ->and($names("/api/recipes?pet_id={$pet->id}"))->toBe(['Rex food'])
        ->and($names('/api/recipes?templates=1'))->toBe(['Template']);

    $this->actingAs($customer)->getJson("/api/recipes?pet_id={$foreignPet->id}")->assertStatus(403);
});

test('only the pet owner can delete a recipe, and never the pet\'s last one', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = recipeTestPet($owner);
    $first = Recipe::create(['name' => 'First', 'pet_type' => 'dog', 'user_id' => $owner->id, 'pet_id' => $pet->id]);
    $second = Recipe::create(['name' => 'Second', 'pet_type' => 'dog', 'user_id' => $owner->id, 'pet_id' => $pet->id]);

    $this->actingAs($intruder)->deleteJson("/api/recipes/{$first->id}")->assertStatus(403);
    $this->actingAs($owner)->deleteJson("/api/recipes/{$first->id}")->assertStatus(200);
    expect(Recipe::find($first->id))->toBeNull();

    $this->actingAs($owner)->deleteJson("/api/recipes/{$second->id}")->assertStatus(422);
    expect(Recipe::find($second->id))->not->toBeNull();
});

test('a recipe used in an order cannot be deleted', function () {
    $owner = User::factory()->create();
    $pet = recipeTestPet($owner);
    $used = Recipe::create(['name' => 'Used', 'pet_type' => 'dog', 'user_id' => $owner->id, 'pet_id' => $pet->id]);
    Recipe::create(['name' => 'Spare', 'pet_type' => 'dog', 'user_id' => $owner->id, 'pet_id' => $pet->id]);
    $order = Order::create(['user_id' => $owner->id, 'total_price' => 10, 'status' => 'pending']);
    OrderItem::create(['order_id' => $order->id, 'pet_id' => $pet->id, 'recipe_id' => $used->id, 'unit_price' => 10, 'quantity' => 1]);

    $this->actingAs($owner)->deleteJson("/api/recipes/{$used->id}")->assertStatus(422);
    expect(OrderItem::where('recipe_id', $used->id)->exists())->toBeTrue();
});

test('calculate-cost prices a draft without persisting anything', function () {
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    $response = $this->actingAs($customer)->postJson('/api/recipes/calculate-cost', [
        'ingredients' => [['ingredient_id' => $ingredient->id, 'quantity' => 0.3, 'unit' => 'kg']],
        'duration_days' => 15,
        'daily_portions' => 2,
    ])->assertStatus(200)
        ->assertJsonStructure(['data' => ['estimatedCost', 'ingredientCost', 'costPerKg', 'totalWeight', 'costBreakdown']]);

    expect((float) $response->json('data.estimatedCost'))->toBeGreaterThan(0.0)
        ->and(Recipe::count())->toBe(0);
});

test('calculate-cost validates its payload', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/recipes/calculate-cost', [
        'ingredients' => [['ingredient_id' => 999, 'quantity' => 1]],
    ])->assertStatus(422);
});

test('calculate-cost requires authentication', function () {
    $this->postJson('/api/recipes/calculate-cost', [])->assertStatus(401);
});

test('listing recipes costs a constant number of queries regardless of how many exist', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ingredients = collect(range(1, 5))->map(fn (int $i) => recipeTestIngredient("Ing {$i}"));

    $makeRecipes = function (int $count) use ($ingredients): void {
        foreach (range(1, $count) as $i) {
            $recipe = Recipe::create(['name' => "R{$i}", 'pet_type' => 'dog', 'duration_days' => 14, 'daily_portions' => 1, 'is_template' => true]);
            foreach ($ingredients as $ingredient) {
                $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);
            }
        }
    };

    $countQueries = function () use ($admin): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->actingAs($admin)->getJson('/api/recipes')->assertStatus(200);
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    };

    $makeRecipes(2);
    $countQueries(); // warm-up: lazily creates the settings row
    $small = $countQueries();

    $makeRecipes(8);
    $large = $countQueries();

    expect($large)->toBe($small);
});
