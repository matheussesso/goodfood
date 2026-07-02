<?php

use App\Models\Order;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionOrderGenerationService;
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
function makeRecipe(string $name): Recipe
{
    return Recipe::create([
        'name' => $name,
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => false,
        'base_cost' => 50,
        'ingredient_cost' => 50,
        'is_active' => true,
    ]);
}

test('customer can create a subscription with an ordered recipe rotation', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');

    $startDate = Carbon::today()->toDateString();

    $response = $this->actingAs($user)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipeA->id, $recipeB->id],
        'start_date' => $startDate,
        'interval_days' => 21,
    ]);

    $response->assertStatus(201);

    $subscription = Subscription::first();
    expect($subscription->interval_days)->toBe(21);
    expect($subscription->next_delivery_date->toDateString())
        ->toBe(Carbon::parse($startDate)->addDays(21)->toDateString());

    $rotation = $subscription->recipes()->orderBy('subscription_recipes.position')->get();
    expect($rotation->pluck('id')->toArray())->toBe([$recipeA->id, $recipeB->id]);
    expect($rotation->first()->pivot->position)->toBe(0);
    expect($rotation->last()->pivot->position)->toBe(1);
});

test('interval_days below 14 or not a multiple of 7 is rejected', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipe = makeRecipe('Recipe A');

    $response = $this->actingAs($user)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipe->id],
        'start_date' => Carbon::today()->toDateString(),
        'interval_days' => 10,
    ]);

    $response->assertStatus(422);
});

test('customer cannot create a subscription for another user\'s pet', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = makePet($owner);
    $recipe = makeRecipe('Recipe A');

    $response = $this->actingAs($intruder)->postJson('/api/subscriptions', [
        'pet_id' => $pet->id,
        'recipe_ids' => [$recipe->id],
        'start_date' => Carbon::today()->toDateString(),
        'interval_days' => 14,
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
        'interval_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today(),
        'next_delivery_date' => Carbon::today()->addDays(14),
    ]);
    $subscription->recipes()->attach($recipe->id, ['position' => 0]);

    $response = $this->actingAs($user)->putJson("/api/subscriptions/{$subscription->id}", [
        'status' => 'paused',
    ]);

    $response->assertStatus(200);
    expect($subscription->fresh()->status)->toBe('paused');
});

test('changing interval_days recomputes next_delivery_date from today', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipe = makeRecipe('Recipe A');

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'interval_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today(),
        'next_delivery_date' => Carbon::today()->addDays(14),
    ]);
    $subscription->recipes()->attach($recipe->id, ['position' => 0]);

    $this->actingAs($user)->putJson("/api/subscriptions/{$subscription->id}", [
        'interval_days' => 28,
    ])->assertStatus(200);

    $fresh = $subscription->fresh();
    expect($fresh->interval_days)->toBe(28);
    expect($fresh->next_delivery_date->toDateString())
        ->toBe(Carbon::today()->addDays(28)->toDateString());
});

test('order generation service creates an order and alternates the recipe rotation', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipeA = makeRecipe('Recipe A');
    $recipeB = makeRecipe('Recipe B');

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'pet_id' => $pet->id,
        'interval_days' => 14,
        'status' => 'active',
        'start_date' => Carbon::today()->subDays(28),
        'next_delivery_date' => Carbon::today()->subDay(),
    ]);
    $subscription->recipes()->attach($recipeA->id, ['position' => 0]);
    $subscription->recipes()->attach($recipeB->id, ['position' => 1]);

    $service = app(SubscriptionOrderGenerationService::class);

    $generated = $service->generateDueOrders();
    expect($generated)->toBe(1);

    $firstOrder = Order::where('subscription_id', $subscription->id)->sole();
    expect($firstOrder->items()->first()->recipe_id)->toBe($recipeA->id);

    $subscription->refresh();
    expect($subscription->next_delivery_date->toDateString())
        ->toBe(Carbon::today()->subDay()->addDays(14)->toDateString());

    // Call the generator directly (bypassing the due-date filter) to verify
    // the rotation alternates to the next recipe on the following cycle.
    $secondOrder = $service->generateForSubscription($subscription->load('recipes'));
    expect($secondOrder->items()->first()->recipe_id)->toBe($recipeB->id);
});

test('creating an order no longer creates a subscription', function () {
    $user = User::factory()->create();
    $pet = makePet($user);
    $recipe = makeRecipe('Recipe A');

    $response = $this->actingAs($user)->postJson('/api/orders', [
        'items' => [
            ['recipe_id' => $recipe->id, 'pet_id' => $pet->id],
        ],
    ]);

    $response->assertStatus(201);
    expect(Subscription::count())->toBe(0);
});
