<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Create a pet owned by the given user.
 */
function createPetFor(User $user, string $name = 'Rex'): Pet
{
    return Pet::create([
        'user_id' => $user->id,
        'name' => $name,
        'type' => 'dog',
    ]);
}

/**
 * Create a recipe owned by the given user (or a template when $user is null).
 */
function createRecipeOwnedBy(?User $user, bool $isTemplate = false): Recipe
{
    return Recipe::create([
        'user_id' => $user?->id,
        'name' => 'Test Recipe',
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => $isTemplate,
        'base_cost' => 50,
        'ingredient_cost' => 50,
        'is_active' => true,
    ]);
}

test('a customer cannot view another customer\'s pet', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = createPetFor($owner);

    $this->actingAs($intruder)->getJson("/api/pets/{$pet->id}")
        ->assertStatus(403)
        ->assertJsonPath('success', false);
});

test('a customer cannot update or delete another customer\'s pet', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = createPetFor($owner);

    $this->actingAs($intruder)->putJson("/api/pets/{$pet->id}", ['name' => 'Hacked'])
        ->assertStatus(403);

    $this->actingAs($intruder)->deleteJson("/api/pets/{$pet->id}")
        ->assertStatus(403);

    expect(Pet::find($pet->id)->name)->toBe('Rex');
});

test('a pet owner cannot transfer their pet to another user via user_id', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $pet = createPetFor($owner);

    $this->actingAs($owner)->putJson("/api/pets/{$pet->id}", [
        'name' => 'Rex Updated',
        'user_id' => $other->id,
    ])->assertStatus(200);

    expect($pet->fresh()->user_id)->toBe($owner->id)
        ->and($pet->fresh()->name)->toBe('Rex Updated');
});

test('an admin can reassign a pet to another user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $pet = createPetFor($owner);

    $this->actingAs($admin)->putJson("/api/pets/{$pet->id}", [
        'user_id' => $other->id,
    ])->assertStatus(200);

    expect($pet->fresh()->user_id)->toBe($other->id);
});

test('a customer cannot mutate ingredients but an admin can', function () {
    $customer = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $payload = [
        'name' => 'Chicken',
        'unit' => 'kg',
        'cost_per_unit' => 10,
    ];

    $this->actingAs($customer)->postJson('/api/ingredients', $payload)
        ->assertStatus(403)
        ->assertJsonPath('success', false);

    $this->actingAs($admin)->postJson('/api/ingredients', $payload)
        ->assertStatus(201)
        ->assertJsonPath('success', true);

    $ingredient = Ingredient::first();

    $this->actingAs($customer)->putJson("/api/ingredients/{$ingredient->id}", ['cost_per_unit' => 99])
        ->assertStatus(403);

    $this->actingAs($customer)->deleteJson("/api/ingredients/{$ingredient->id}")
        ->assertStatus(403);
});

test('a customer cannot update another customer\'s recipe', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $recipe = createRecipeOwnedBy($owner);

    $this->actingAs($intruder)->putJson("/api/recipes/{$recipe->id}", ['name' => 'Hacked'])
        ->assertStatus(403)
        ->assertJsonPath('success', false);
});

test('a recipe owner cannot reassign ownership or promote to template', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $recipe = createRecipeOwnedBy($owner);

    $this->actingAs($owner)->putJson("/api/recipes/{$recipe->id}", [
        'name' => 'Renamed',
        'user_id' => $other->id,
        'is_template' => true,
    ])->assertStatus(200);

    $fresh = $recipe->fresh();
    expect($fresh->user_id)->toBe($owner->id)
        ->and($fresh->is_template)->toBeFalse()
        ->and($fresh->name)->toBe('Renamed');
});

test('templates are visible to any customer', function () {
    $customer = User::factory()->create();
    $template = createRecipeOwnedBy(null, isTemplate: true);

    $this->actingAs($customer)->getJson("/api/recipes/{$template->id}")
        ->assertStatus(200)
        ->assertJsonPath('success', true);
});

test('a customer cannot modify a template recipe', function () {
    $customer = User::factory()->create();
    $template = createRecipeOwnedBy($customer, isTemplate: true);

    $this->actingAs($customer)->putJson("/api/recipes/{$template->id}", ['name' => 'Hacked'])
        ->assertStatus(403);
});

test('a customer cannot order for a pet they do not own', function () {
    $customer = User::factory()->create();
    $otherOwner = User::factory()->create();
    $foreignPet = createPetFor($otherOwner, 'Foreign');
    $recipe = createRecipeOwnedBy($customer);

    $this->actingAs($customer)->postJson('/api/orders', [
        'items' => [
            ['recipe_id' => $recipe->id, 'pet_id' => $foreignPet->id],
        ],
    ])->assertStatus(403)
        ->assertJsonPath('success', false);
});
