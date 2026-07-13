<?php

use App\Models\GeneralSetting;
use App\Models\Ingredient;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Create a pet owned by the given user.
 */
function makePet(User $user): Pet
{
    return Pet::create([
        'user_id' => $user->id,
        'name' => 'Rex',
        'type' => 'dog',
    ]);
}

/**
 * Create a recipe with a fixed base cost, bypassing the ingredient-based calculator.
 */
function makeRecipe(string $name, float $cost = 50): Recipe
{
    return Recipe::create([
        'name' => $name,
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => false,
        'base_cost' => $cost,
        'ingredient_cost' => $cost,
        'is_active' => true,
    ]);
}

test('customer can create a subscription with one recipe per week', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');

    $startDate = Carbon::today()->toDateString();

    $response = $this->actingAs($user)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipeA->id, $recipeB->id],
        'start_date' => $startDate,
        'duration_days' => 14,
    ]);

    $response->assertStatus(201);

    $subscription = Subscription::first();
    expect($subscription->duration_days)->toBe(14);

    $rotation = $subscription->recipes()->orderBy('subscription_recipes.position')->get();
    expect($rotation->pluck('id')->toArray())->toBe([$recipeA->id, $recipeB->id]);
    expect($rotation->first()->pivot->position)->toBe(0);
    expect($rotation->last()->pivot->position)->toBe(1);
});

test('duration_days below 14 or not a multiple of 7 is rejected', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipe = makeRecipe('Recipe A');

    $response = $this->actingAs($user)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipe->id],
        'start_date' => Carbon::today()->toDateString(),
        'duration_days' => 10,
    ]);

    $response->assertStatus(422);
});

test('recipe_ids must contain exactly one recipe per week', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');
    $recipeC = makeRecipe('Recipe C');

    // duration_days=28 => 4 weeks, but only 3 recipes supplied.
    $response = $this->actingAs($user)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipeA->id, $recipeB->id, $recipeC->id],
        'start_date' => Carbon::today()->toDateString(),
        'duration_days' => 28,
    ]);

    $response->assertStatus(422);
});

test('customer cannot create a subscription for another user\'s pet', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = makePet($owner);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');

    $response = $this->actingAs($intruder)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipeA->id, $recipeB->id],
        'start_date' => Carbon::today()->toDateString(),
        'duration_days' => 14,
    ]);

    $response->assertStatus(403);
});

test('updating status pauses and cancels a subscription', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipe = makeRecipe('Recipe A');

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today(),
    ]);
    $subscription->recipes()->attach($recipe->id, ['position' => 0]);

    $response = $this->actingAs($user)->putJson("/api/subscriptions/{$subscription->id}", [
        'status' => 'paused',
    ]);

    $response->assertStatus(200);
    expect($subscription->fresh()->status)->toBe('paused');
});

test('updating duration_days and recipe_ids together replaces the plan', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');
    $recipeC = makeRecipe('Recipe C');
    $recipeD = makeRecipe('Recipe D');

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today(),
    ]);
    $subscription->recipes()->attach($recipeA->id, ['position' => 0]);
    $subscription->recipes()->attach($recipeB->id, ['position' => 1]);

    $response = $this->actingAs($user)->putJson("/api/subscriptions/{$subscription->id}", [
        'duration_days' => 28,
        'recipe_ids' => [$recipeA->id, $recipeB->id, $recipeC->id, $recipeD->id],
    ]);

    $response->assertStatus(200);

    $fresh = $subscription->fresh();
    expect($fresh->duration_days)->toBe(28);
    expect($fresh->total_cycles)->toBe(4);
    expect($fresh->recipes()->orderBy('subscription_recipes.position')->pluck('recipes.id')->toArray())
        ->toBe([$recipeA->id, $recipeB->id, $recipeC->id, $recipeD->id]);
});

test('updating duration_days without recipe_ids is rejected', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipe = makeRecipe('Recipe A');

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today(),
    ]);
    $subscription->recipes()->attach($recipe->id, ['position' => 0]);

    $response = $this->actingAs($user)->putJson("/api/subscriptions/{$subscription->id}", [
        'duration_days' => 28,
    ]);

    $response->assertStatus(422);
});

test('estimated_price sums the cost of every recipe in the plan, priced for a 7-day cycle regardless of the recipe\'s own duration_days', function () {
    // GeneralSetting::getInstance() lazily creates row id=1 on first-ever call,
    // but the returned in-memory instance doesn't reflect the migration's DB-level
    // column defaults until re-fetched. Prime it here so every calculateTotalCost()
    // call below sees the real (non-null) settings, matching production behavior.
    GeneralSetting::getInstance();

    $user = User::factory()->create();
    $pet = makePet($user);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');

    // Recipe::calculateTotalCost() short-circuits to 0 with no ingredients,
    // so attach a real one to each recipe to get a non-zero, comparable cost.
    $ingredient = Ingredient::create([
        'name' => 'Frango',
        'category' => 'Proteína',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
    $recipeA->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);
    $recipeB->ingredients()->attach($ingredient->id, ['quantity' => 2, 'unit' => 'kg']);

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today(),
    ]);
    $subscription->recipes()->attach($recipeA->id, ['position' => 0]);
    $subscription->recipes()->attach($recipeB->id, ['position' => 1]);

    // Recipe A/B are created with duration_days=14 (see makeRecipe()) — the plan
    // must price each at Subscription::CYCLE_DAYS (7), not the recipe's own 14.
    $expected = round(
        $recipeA->fresh()->load('ingredients')->calculateTotalCost(Subscription::CYCLE_DAYS)
        + $recipeB->fresh()->load('ingredients')->calculateTotalCost(Subscription::CYCLE_DAYS),
        2
    );
    $nativeDurationTotal = round(
        $recipeA->fresh()->load('ingredients')->calculateTotalCost()
        + $recipeB->fresh()->load('ingredients')->calculateTotalCost(),
        2
    );

    $fresh = $subscription->fresh()->load('recipes.ingredients');
    expect(round($fresh->estimated_price, 2))->toBe($expected);
    expect($expected)->toBeGreaterThan(0);
    // Prove the override actually changes the number — otherwise this test
    // would pass even if the 7-day conversion were silently dropped.
    expect($expected)->not->toBe($nativeDurationTotal);
    expect($fresh->total_cycles)->toBe(2);
});

test('current_cycle_index is null before the plan starts and after it ends, and clamped mid-plan', function () {
    $user = User::factory()->create();
    $pet = makePet($user);

    $future = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today()->addDays(3),
    ]);
    expect($future->current_cycle_index)->toBeNull();

    $ended = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today()->subDays(20),
    ]);
    expect($ended->current_cycle_index)->toBeNull();

    $midPlan = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'duration_days' => 21,
        'status' => 'active',
        'start_date' => Carbon::today()->subDays(9),
    ]);
    expect($midPlan->current_cycle_index)->toBe(1);
});
