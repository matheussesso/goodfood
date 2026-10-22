<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('customers list only their own pets while admins list all of them', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);
    Pet::create(['user_id' => $owner->id, 'name' => 'Mine', 'type' => 'dog']);
    Pet::create(['user_id' => $other->id, 'name' => 'Theirs', 'type' => 'cat']);

    $this->actingAs($owner)->getJson('/api/pets')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Mine');

    $this->actingAs($admin)->getJson('/api/pets')->assertJsonCount(2, 'data');
});

/**
 * Create a priced ingredient for pet-creation tests.
 */
function petTestIngredient(): Ingredient
{
    return Ingredient::create(['name' => 'Frango', 'unit' => 'kg', 'cost_per_unit' => 10, 'loss_rate' => 1, 'difficulty_multiplier' => 1]);
}

/**
 * A first recipe heavy enough for the minimum-weight rule.
 *
 * @return array<string, mixed>
 */
function petTestRecipe(Ingredient $ingredient): array
{
    return [
        'name' => 'Frango com legumes',
        'duration_days' => 15,
        'daily_portions' => 2,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.3, 'unit' => 'kg']],
    ];
}

test('a customer creates a pet together with its first recipe and cannot choose another owner', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();

    $response = $this->actingAs($customer)->postJson('/api/pets', [
        'name' => 'Rex',
        'type' => 'dog',
        'user_id' => $other->id,
        'recipe' => petTestRecipe(petTestIngredient()),
    ])->assertStatus(201)
        ->assertJsonPath('data.user_id', $customer->id)
        ->assertJsonCount(1, 'data.recipes')
        ->assertJsonPath('data.recipes.0.name', 'Frango com legumes');

    $pet = Pet::find($response->json('data.id'));
    $recipe = $pet->recipes->first();
    expect($recipe->user_id)->toBe($customer->id)
        ->and($recipe->pet_type)->toBe('dog')
        ->and($recipe->is_template)->toBeFalse()
        ->and((float) $recipe->base_cost)->toBeGreaterThan(0.0);
});

test('a pet can start from a catalog template', function () {
    $customer = User::factory()->create();
    $template = Recipe::create(['name' => 'Mix Frango', 'pet_type' => 'all', 'duration_days' => 14, 'daily_portions' => 2, 'is_template' => true]);
    $template->ingredients()->attach(petTestIngredient()->id, ['quantity' => 0.3, 'unit' => 'kg']);

    $response = $this->actingAs($customer)->postJson('/api/pets', [
        'name' => 'Mel',
        'type' => 'cat',
        'recipe' => ['template_id' => $template->id],
    ])->assertStatus(201)->assertJsonPath('data.recipes.0.name', 'Mix Frango');

    $copy = Pet::find($response->json('data.id'))->recipes->first();
    expect($copy->id)->not->toBe($template->id)
        ->and($copy->is_template)->toBeFalse()
        ->and($copy->ingredients)->toHaveCount(1);
});

test('a pet is never created without a recipe', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/pets', ['name' => 'Rex', 'type' => 'dog'])
        ->assertStatus(422)->assertJsonStructure(['errors' => ['recipe']]);

    $this->actingAs($customer)->postJson('/api/pets', ['name' => 'Rex', 'type' => 'dog', 'recipe' => ['name' => 'Vazia']])
        ->assertStatus(422)->assertJsonStructure(['errors' => ['recipe.ingredients']]);

    expect(Pet::count())->toBe(0);
});

test('the first recipe follows the minimum weight rule, and a failure creates nothing', function () {
    $customer = User::factory()->create();
    $ingredient = petTestIngredient();

    $this->actingAs($customer)->postJson('/api/pets', [
        'name' => 'Rex',
        'recipe' => ['name' => 'Leve', 'duration_days' => 15, 'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.05, 'unit' => 'kg']]],
    ])->assertStatus(422)->assertJsonStructure(['errors' => ['recipe.ingredients']]);

    expect(Pet::count())->toBe(0)->and(Recipe::count())->toBe(0);
});

test('only active catalog templates can seed a pet recipe', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();
    $otherPet = Pet::create(['user_id' => $other->id, 'name' => 'Thor', 'type' => 'dog']);
    $private = Recipe::create(['name' => 'Privada', 'pet_type' => 'dog', 'user_id' => $other->id, 'pet_id' => $otherPet->id]);

    $this->actingAs($customer)->postJson('/api/pets', ['name' => 'Rex', 'recipe' => ['template_id' => $private->id]])
        ->assertStatus(422)->assertJsonStructure(['errors' => ['recipe.template_id']]);
});

test('an admin can create a pet with its recipe on behalf of a customer', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();

    $response = $this->actingAs($admin)->postJson('/api/pets', [
        'name' => 'Luna',
        'type' => 'cat',
        'user_id' => $customer->id,
        'recipe' => petTestRecipe(petTestIngredient()),
    ])->assertStatus(201)->assertJsonPath('data.user_id', $customer->id);

    expect(Pet::find($response->json('data.id'))->recipes->first()->user_id)->toBe($customer->id);
});

test('pet creation validates its fields', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/pets', [
        'type' => 'bird',
        'weight' => 500,
        'microchip_number' => 'abc',
    ])->assertStatus(422)
        ->assertJsonStructure(['errors' => ['name', 'type', 'weight', 'microchip_number']]);
});

test('an owner can show, update and delete their pet', function () {
    $owner = User::factory()->create();
    $pet = Pet::create(['user_id' => $owner->id, 'name' => 'Rex', 'type' => 'dog']);

    $this->actingAs($owner)->getJson("/api/pets/{$pet->id}")
        ->assertStatus(200)
        ->assertJsonStructure(['data' => ['id', 'recipes', 'orders', 'vaccines', 'documents']]);

    $this->actingAs($owner)->putJson("/api/pets/{$pet->id}", ['name' => 'Rex II', 'neutered' => true])
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Rex II');

    $this->actingAs($owner)->deleteJson("/api/pets/{$pet->id}")->assertStatus(200);
    expect(Pet::find($pet->id))->toBeNull();
});

test('a pet photo upload returns a public url and rejects non-images', function () {
    Storage::fake('public');
    $customer = User::factory()->create();

    $response = $this->actingAs($customer)->postJson('/api/pets/upload-photo', [
        'photo' => UploadedFile::fake()->image('rex.jpg'),
    ])->assertStatus(200);

    expect($response->json('data.photo_url'))->toContain('/storage/pets/');

    $this->actingAs($customer)->postJson('/api/pets/upload-photo', [
        'photo' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
    ])->assertStatus(422)->assertJsonStructure(['errors' => ['photo']]);
});

test('pet endpoints require authentication', function () {
    $this->getJson('/api/pets')->assertStatus(401);
    $this->postJson('/api/pets/upload-photo')->assertStatus(401);
});
