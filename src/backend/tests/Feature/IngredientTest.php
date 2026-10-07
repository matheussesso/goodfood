<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Create an ingredient with sensible defaults.
 *
 * @param  array<string, mixed>  $overrides
 */
function makeIngredient(array $overrides = []): Ingredient
{
    return Ingredient::create($overrides + [
        'name' => 'Frango',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
}

test('customers only see active ingredients while admins see all of them', function () {
    makeIngredient(['name' => 'Active']);
    makeIngredient(['name' => 'Inactive', 'is_active' => false]);

    $customer = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($customer)->getJson('/api/ingredients')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Active');

    $this->actingAs($admin)->getJson('/api/ingredients')->assertJsonCount(2, 'data');
});

test('an admin can create, view, update and delete an ingredient', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $id = $this->actingAs($admin)->postJson('/api/ingredients', [
        'name' => 'Batata',
        'unit' => 'kg',
        'cost_per_unit' => 5,
    ])->assertStatus(201)->json('data.id');

    $this->actingAs($admin)->getJson("/api/ingredients/{$id}")
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Batata');

    $this->actingAs($admin)->putJson("/api/ingredients/{$id}", ['cost_per_unit' => 8])
        ->assertStatus(200);

    $ingredient = Ingredient::find($id);
    expect((float) $ingredient->cost_per_unit)->toBe(8.0)
        ->and((float) $ingredient->unit_cost)->toBe(8.0);

    $this->actingAs($admin)->deleteJson("/api/ingredients/{$id}")->assertStatus(200);
    expect(Ingredient::find($id))->toBeNull();
});

test('creating an ingredient validates required fields', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->postJson('/api/ingredients', ['cost_per_unit' => -1])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['name', 'unit', 'cost_per_unit']]);
});

test('only admins can view a single ingredient', function () {
    $ingredient = makeIngredient();
    $customer = User::factory()->create();

    $this->actingAs($customer)->getJson("/api/ingredients/{$ingredient->id}")->assertStatus(403);
});

test('ingredient endpoints require authentication', function () {
    $this->getJson('/api/ingredients')->assertStatus(401);
});
