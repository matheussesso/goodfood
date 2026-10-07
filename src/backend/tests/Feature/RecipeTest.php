<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Create a priced ingredient measured in kg.
 */
function recipeTestIngredient(string $name = 'Frango'): Ingredient
{
    return Ingredient::create([
        'name' => $name,
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
        'is_active' => true,
    ]);
}

/**
 * Build a valid recipe payload heavy enough to pass the minimum-weight rule.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function recipePayload(Ingredient $ingredient, array $overrides = []): array
{
    return $overrides + [
        'name' => 'Frango com legumes',
        'description' => 'Receita balanceada',
        'pet_type' => 'dog',
        'duration_days' => 15,
        'daily_portions' => 2,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.3, 'unit' => 'kg']],
    ];
}

test('a customer creates a recipe that is always private and owned by them', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();
    $pet = Pet::create(['user_id' => $customer->id, 'name' => 'Rex', 'type' => 'dog']);
    $ingredient = recipeTestIngredient();

    $response = $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, [
        'is_template' => true,
        'user_id' => $other->id,
        'pet_ids' => [$pet->id],
    ]))->assertStatus(201);

    $recipe = Recipe::find($response->json('data.id'));
    expect($recipe->user_id)->toBe($customer->id)
        ->and($recipe->is_template)->toBeFalse()
        ->and($recipe->ingredients)->toHaveCount(1)
        ->and($recipe->pets->pluck('id')->all())->toBe([$pet->id])
        ->and((float) $recipe->base_cost)->toBeGreaterThan(0.0);
});

test('a customer recipe below the minimum total weight is rejected', function () {
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    // 0.05 kg/day x 15 days = 0.75 kg < 1.5 kg
    $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, [
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.05, 'unit' => 'kg']],
    ]))->assertStatus(422)->assertJsonStructure(['errors' => ['ingredients']]);
});

test('the minimum weight rule counts grams and millilitres correctly', function () {
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    // 100 g/day x 15 days = 1.5 kg exactly
    $this->actingAs($customer)->postJson('/api/recipes', recipePayload($ingredient, [
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 100, 'unit' => 'g']],
    ]))->assertStatus(201);
});

test('an admin can create a light template for another user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    $response = $this->actingAs($admin)->postJson('/api/recipes', recipePayload($ingredient, [
        'is_template' => true,
        'user_id' => $customer->id,
        'ingredients' => [['id' => $ingredient->id, 'quantity' => 0.01, 'unit' => 'kg']],
    ]))->assertStatus(201);

    $recipe = Recipe::find($response->json('data.id'));
    expect($recipe->is_template)->toBeTrue()->and($recipe->user_id)->toBe($customer->id);
});

test('recipe creation validates its fields', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/recipes', [
        'duration_days' => 0,
        'ingredients' => [['id' => 999, 'quantity' => -1]],
    ])->assertStatus(422)
        ->assertJsonStructure(['errors' => ['name', 'duration_days', 'ingredients.0.id', 'ingredients.0.quantity']]);
});

test('an owner updates a recipe, re-syncing ingredients and pets', function () {
    $customer = User::factory()->create();
    $pet = Pet::create(['user_id' => $customer->id, 'name' => 'Rex', 'type' => 'dog']);
    $first = recipeTestIngredient('Frango');
    $second = recipeTestIngredient('Arroz');

    $id = $this->actingAs($customer)->postJson('/api/recipes', recipePayload($first))->json('data.id');

    $this->actingAs($customer)->putJson("/api/recipes/{$id}", [
        'name' => 'Arroz com frango',
        'ingredients' => [['id' => $second->id, 'quantity' => 0.4, 'unit' => 'kg']],
        'pet_ids' => [$pet->id],
    ])->assertStatus(200)->assertJsonPath('data.name', 'Arroz com frango');

    $recipe = Recipe::find($id);
    expect($recipe->ingredients->pluck('id')->all())->toBe([$second->id])
        ->and($recipe->pets->pluck('id')->all())->toBe([$pet->id]);
});

test('recipe listing is scoped to templates, own recipes and recipes linked to own pets', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();
    $pet = Pet::create(['user_id' => $customer->id, 'name' => 'Rex', 'type' => 'dog']);

    $template = Recipe::create(['name' => 'Template', 'pet_type' => 'dog', 'is_template' => true]);
    $own = Recipe::create(['name' => 'Own', 'pet_type' => 'dog', 'user_id' => $customer->id]);
    $linked = Recipe::create(['name' => 'Linked', 'pet_type' => 'dog', 'user_id' => $other->id]);
    $linked->pets()->attach($pet->id);
    Recipe::create(['name' => 'Hidden', 'pet_type' => 'dog', 'user_id' => $other->id]);

    $names = collect($this->actingAs($customer)->getJson('/api/recipes')->json('data'))->pluck('name')->sort()->values()->all();

    expect($names)->toBe(['Linked', 'Own', 'Template']);
});

test('only the owner can delete a recipe', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $recipe = Recipe::create(['name' => 'Own', 'pet_type' => 'dog', 'user_id' => $owner->id]);

    $this->actingAs($intruder)->deleteJson("/api/recipes/{$recipe->id}")->assertStatus(403);
    $this->actingAs($owner)->deleteJson("/api/recipes/{$recipe->id}")->assertStatus(200);
    expect(Recipe::find($recipe->id))->toBeNull();
});

test('calculate-cost prices a draft without persisting anything', function () {
    $customer = User::factory()->create();
    $ingredient = recipeTestIngredient();

    $response = $this->actingAs($customer)->postJson('/api/recipes/calculate-cost', [
        'ingredients' => [['ingredient_id' => $ingredient->id, 'quantity' => 0.3, 'unit' => 'kg']],
        'duration_days' => 15,
        'daily_portions' => 2,
    ])->assertStatus(200)
        ->assertJsonStructure(['data' => ['estimatedCost', 'ingredientCost', 'costPerKg', 'totalWeight', 'costBreakdown']]);

    expect((float) $response->json('data.estimatedCost'))->toBeGreaterThan(0.0)
        ->and(Recipe::count())->toBe(0);
});

test('calculate-cost validates its payload', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/recipes/calculate-cost', [
        'ingredients' => [['ingredient_id' => 999, 'quantity' => 1]],
    ])->assertStatus(422);
});

test('calculate-cost requires authentication', function () {
    $this->postJson('/api/recipes/calculate-cost', [])->assertStatus(401);
});

test('listing recipes costs a constant number of queries regardless of how many exist', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ingredients = collect(range(1, 5))->map(fn (int $i) => recipeTestIngredient("Ing {$i}"));

    $makeRecipes = function (int $count) use ($ingredients): void {
        foreach (range(1, $count) as $i) {
            $recipe = Recipe::create(['name' => "R{$i}", 'pet_type' => 'dog', 'duration_days' => 14, 'daily_portions' => 1, 'is_template' => true]);
            foreach ($ingredients as $ingredient) {
                $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);
            }
        }
    };

    $countQueries = function () use ($admin): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->actingAs($admin)->getJson('/api/recipes')->assertStatus(200);
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    };

    $makeRecipes(2);
    $countQueries(); // warm-up: lazily creates the settings row
    $small = $countQueries();

    $makeRecipes(8);
    $large = $countQueries();

    expect($large)->toBe($small);
});
