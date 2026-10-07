<?php

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('customer can create an order and then list and view it', function () {
    $user = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $recipe = Recipe::create([
        'name' => 'Recipe A',
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => true,
        'base_cost' => 0,
        'ingredient_cost' => 0,
        'is_active' => true,
    ]);
    $ingredient = Ingredient::create([
        'name' => 'Frango',
        'category' => 'Proteína',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
    $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);

    $created = $this->actingAs($user)->postJson('/api/orders', [
        'items' => [['recipe_id' => $recipe->id, 'pet_id' => $pet->id]],
    ])->assertStatus(201);

    $orderId = $created->json('data.id');
    expect($orderId)->not->toBeNull();

    // Regression: index/show used to eager-load a removed 'subscription'
    // relation and would 500 here.
    $this->actingAs($user)->getJson('/api/orders')->assertStatus(200);
    $this->actingAs($user)->getJson("/api/orders/{$orderId}")->assertStatus(200);
});

test('order pricing reflects the ingredient price at the moment of creation, live', function () {
    $user = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $recipe = Recipe::create([
        'name' => 'Recipe A',
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => true,
        // Deliberately stale cached value the order must NOT use.
        'base_cost' => 999,
        'ingredient_cost' => 999,
        'is_active' => true,
    ]);
    $ingredient = Ingredient::create([
        'name' => 'Frango',
        'category' => 'Proteína',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
    $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);

    $response = $this->actingAs($user)->postJson('/api/orders', [
        'items' => [['recipe_id' => $recipe->id, 'pet_id' => $pet->id]],
    ])->assertStatus(201);

    expect((float) $response->json('data.total_price'))->not->toBe(999.0);
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
    $user = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $recipe = Recipe::create(['name' => 'R', 'pet_type' => 'dog', 'duration_days' => 14, 'daily_portions' => 1, 'is_template' => true]);

    $response = $this->actingAs($user)->postJson('/api/orders', [
        'items' => [
            ['recipe_id' => $recipe->id, 'pet_id' => $pet->id],
            ['recipe_id' => $recipe->id],
        ],
    ])->assertStatus(201);

    $response->assertJsonPath('data.status', 'pending_payment')
        ->assertJsonPath('data.invoice.status', 'pending')
        ->assertJsonCount(2, 'data.items');

    expect(Carbon::parse($response->json('data.invoice.due_date'))->toDateString())
        ->toBe(now()->addDays(3)->toDateString());
});
