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

test('a customer clones a template into a private recipe linked to their pet', function () {
    $user = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $template = cloneTemplate();

    $response = $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['pet_ids' => [$pet->id]])
        ->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Mix Frango');

    $copy = Recipe::find($response->json('data.id'));
    expect($copy->id)->not->toBe($template->id)
        ->and($copy->user_id)->toBe($user->id)
        ->and($copy->is_template)->toBeFalse()
        ->and($copy->description)->toBe('Balanced')
        ->and($copy->instructions)->toBe('Cook it')
        ->and($copy->duration_days)->toBe(14)
        ->and($copy->daily_portions)->toBe(2)
        ->and($copy->pets->pluck('id')->all())->toBe([$pet->id])
        ->and($copy->ingredients)->toHaveCount(1)
        ->and((float) $copy->ingredients->first()->pivot->quantity)->toBe(0.3)
        ->and($copy->ingredients->first()->pivot->unit)->toBe('kg');
    // The stale cached cost of the template is never copied: it is recomputed.
    expect((float) $copy->base_cost)->not->toBe(999.0)->and((float) $copy->base_cost)->toBeGreaterThan(0.0);
    // The template itself is untouched.
    expect($template->fresh()->is_template)->toBeTrue()->and($template->pets()->count())->toBe(0);
});

test('cloning accepts a custom name and works without pets', function () {
    $user = User::factory()->create();
    $template = cloneTemplate();

    $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['name' => 'Minha versão'])
        ->assertStatus(201)
        ->assertJsonPath('data.name', 'Minha versão')
        ->assertJsonCount(0, 'data.pets');
});

test('a customer cannot link a clone to someone else\'s pet', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $foreign = Pet::create(['user_id' => $other->id, 'name' => 'Theirs', 'type' => 'cat']);
    $template = cloneTemplate();

    $this->actingAs($user)->postJson("/api/recipes/{$template->id}/clone", ['pet_ids' => [$foreign->id]])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['pet_ids.0']]);

    expect(Recipe::where('user_id', $user->id)->count())->toBe(0);
});

test('a customer cannot clone another customer\'s private recipe', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $private = Recipe::create(['user_id' => $other->id, 'name' => 'Private', 'pet_type' => 'dog', 'is_template' => false]);

    $this->actingAs($user)->postJson("/api/recipes/{$private->id}/clone")->assertStatus(403);
});

test('a visible-but-not-owned recipe linked to the user\'s pet cannot be cloned', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $pet = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $shared = Recipe::create(['user_id' => $other->id, 'name' => 'Shared', 'pet_type' => 'dog', 'is_template' => false]);
    $shared->pets()->attach($pet->id);

    $this->actingAs($user)->getJson("/api/recipes/{$shared->id}")->assertStatus(200);
    $this->actingAs($user)->postJson("/api/recipes/{$shared->id}/clone")->assertStatus(403);
});

test('a customer can clone their own recipe', function () {
    $user = User::factory()->create();
    $own = Recipe::create(['user_id' => $user->id, 'name' => 'Own', 'pet_type' => 'dog', 'is_template' => false]);

    $this->actingAs($user)->postJson("/api/recipes/{$own->id}/clone", ['name' => 'Own 2'])
        ->assertStatus(201);

    expect(Recipe::where('user_id', $user->id)->count())->toBe(2);
});

test('an admin can clone a template for any pet', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();
    $pet = Pet::create(['user_id' => $customer->id, 'name' => 'Rex', 'type' => 'dog']);
    $template = cloneTemplate();

    $this->actingAs($admin)->postJson("/api/recipes/{$template->id}/clone", ['pet_ids' => [$pet->id]])
        ->assertStatus(201);
});

test('cloning requires authentication', function () {
    $template = cloneTemplate();

    $this->postJson("/api/recipes/{$template->id}/clone")->assertStatus(401);
});
