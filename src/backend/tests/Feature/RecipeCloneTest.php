<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Create a catalog template with one priced ingredient.
 */
function cloneTemplate(): Recipe
{
    $ingredient = Ingredient::create(['name' => 'Frango', 'unit' => 'kg', 'cost_per_unit' => 10, 'loss_rate' => 1, 'difficulty_multiplier' => 1]);
    $template = Recipe::create([
        'name' => 'Mix Frango',
        'description' => 'Balanced',
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 2,
        'instructions' => 'Cook it',
        'is_template' => true,
        'base_cost' => 999,
        'ingredient_cost' => 999,
    ]);
    $template->ingredients()->attach($ingredient->id, ['quantity' => 0.3, 'unit' => 'kg']);

    return $template;
}

test('a customer clones a template into a private recipe of their pet', function () {
    $user = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $template = cloneTemplate();

    $response = $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['pet_id' => $pet->id])
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Mix Frango')
        ->assertJsonPath('data.pet_id', $pet->id);

    $copy = Recipe::find($response->json('data.id'));
    expect($copy->id)->not->toBe($template->id)
        ->and($copy->user_id)->toBe($user->id)
        ->and($copy->pet_id)->toBe($pet->id)
        ->and($copy->is_template)->toBeFalse()
        ->and($copy->description)->toBe('Balanced')
        ->and($copy->instructions)->toBe('Cook it')
        ->and($copy->duration_days)->toBe(14)
        ->and($copy->daily_portions)->toBe(2)
        ->and($copy->ingredients)->toHaveCount(1)
        ->and((float) $copy->ingredients->first()->pivot->quantity)->toBe(0.3)
        ->and($copy->ingredients->first()->pivot->unit)->toBe('kg');
    // The stale cached cost of the template is never copied: it is recomputed.
    expect((float) $copy->base_cost)->not->toBe(999.0)->and((float) $copy->base_cost)->toBeGreaterThan(0.0);
    // The template itself is untouched.
    expect($template->fresh()->is_template)->toBeTrue()->and($template->fresh()->pet_id)->toBeNull();
});

test('cloning accepts a custom name and requires a target pet', function () {
    $user = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $template = cloneTemplate();

    $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['name' => 'Minha versão'])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['pet_id']]);

    $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['name' => 'Minha versão', 'pet_id' => $pet->id])
        ->assertStatus(201)
        ->assertJsonPath('data.name', 'Minha versão');
});

test('a customer cannot copy a recipe to someone else\'s pet', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $foreign = Pet::create(['user_id' => $other->id, 'name' => 'Theirs', 'type' => 'cat']);
    $template = cloneTemplate();

    $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['pet_id' => $foreign->id])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['pet_id']]);

    expect(Recipe::where('pet_id', $foreign->id)->count())->toBe(0);
});

test('a customer cannot clone another customer\'s private recipe', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $foreignPet = Pet::create(['user_id' => $other->id, 'name' => 'Theirs', 'type' => 'dog']);
    $private = Recipe::create(['user_id' => $other->id, 'pet_id' => $foreignPet->id, 'name' => 'Private', 'pet_type' => 'dog', 'is_template' => false]);

    $this->actingAs($user)->postJson("/api/recipes/{$private->id}/clone", ['pet_id' => $pet->id])->assertStatus(403);
});

test('a customer can copy a recipe from one of their pets to another', function () {
    $user = User::factory()->create();
    $rex = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $mel = Pet::create(['user_id' => $user->id, 'name' => 'Mel', 'type' => 'dog']);
    $own = Recipe::create(['user_id' => $user->id, 'pet_id' => $rex->id, 'name' => 'Own', 'pet_type' => 'dog', 'is_template' => false]);

    $this->actingAs($user)->postJson("/api/recipes/{$own->id}/clone", ['name' => 'Own 2', 'pet_id' => $mel->id])
        ->assertStatus(201)
        ->assertJsonPath('data.pet_id', $mel->id);

    expect(Recipe::where('user_id', $user->id)->count())->toBe(2);
});

test('an admin can clone a template for any pet', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();
    $pet = Pet::create(['user_id' => $customer->id, 'name' => 'Rex', 'type' => 'dog']);
    $template = cloneTemplate();

    $response = $this->actingAs($admin)->postJson("/api/recipes/{$template->id}/clone", ['pet_id' => $pet->id])
        ->assertStatus(201);

    expect(Recipe::find($response->json('data.id'))->user_id)->toBe($customer->id);
});

test('cloning requires authentication', function () {
    $template = cloneTemplate();

    $this->postJson("/api/recipes/{$template->id}/clone")->assertStatus(401);
});
