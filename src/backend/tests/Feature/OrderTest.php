<?php

use App\Models\Ingredient;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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
