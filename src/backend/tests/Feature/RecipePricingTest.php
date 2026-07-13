<?php

use App\Models\GeneralSetting;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('recipe cost reflects the current ingredient price without needing to resave the recipe', function () {
    // See SubscriptionTest.php for why this priming call is needed.
    GeneralSetting::getInstance();

    $user = User::factory()->create(['role' => 'admin']);
    $ingredient = Ingredient::create([
        'name' => 'Frango',
        'category' => 'Proteína',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);

    $recipe = Recipe::create([
        'user_id' => $user->id,
        'name' => 'Recipe A',
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => true,
        // Deliberately wrong/stale cached values — proves the API doesn't trust them.
        'base_cost' => 999,
        'ingredient_cost' => 999,
        'is_active' => true,
    ]);
    $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);

    $firstCost = $this->actingAs($user)
        ->getJson("/api/recipes/{$recipe->id}")
        ->assertStatus(200)
        ->json('data.base_cost');

    expect((float) $firstCost)->not->toBe(999.0);

    // Ingredient price changes — nothing ever touches the recipe row itself.
    $ingredient->update(['cost_per_unit' => 50]);

    $secondCost = $this->actingAs($user)
        ->getJson("/api/recipes/{$recipe->id}")
        ->assertStatus(200)
        ->json('data.base_cost');

    expect((float) $secondCost)->toBeGreaterThan((float) $firstCost);
});
