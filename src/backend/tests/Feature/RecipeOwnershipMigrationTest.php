<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

/**
 * The migration under test, loaded fresh so its up()/down() can be called.
 */
function recipeOwnershipMigration(): object
{
    return require database_path('migrations/2026_10_22_000001_make_recipes_belong_to_a_single_pet.php');
}

/**
 * Recreate the legacy pet_recipe pivot (already dropped by the test migrations).
 *
 * @param  array<int, array{0: int, 1: int}>  $links  [pet_id, recipe_id] pairs
 */
function legacyPivot(array $links): void
{
    Schema::create('pet_recipe', function (Blueprint $table) {
        $table->id();
        $table->foreignId('pet_id')->constrained()->cascadeOnDelete();
        $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
    });

    foreach ($links as [$petId, $recipeId]) {
        DB::table('pet_recipe')->insert(['pet_id' => $petId, 'recipe_id' => $recipeId]);
    }
}

test('a recipe shared by two pets becomes one recipe per pet, keeping ingredients and order history', function () {
    $owner = User::factory()->create();
    $rex = Pet::create(['user_id' => $owner->id, 'name' => 'Rex', 'type' => 'dog']);
    $mel = Pet::create(['user_id' => $owner->id, 'name' => 'Mel', 'type' => 'dog']);
    $ingredient = Ingredient::create(['name' => 'Frango', 'unit' => 'kg', 'cost_per_unit' => 10, 'loss_rate' => 1, 'difficulty_multiplier' => 1]);
    $shared = Recipe::create(['user_id' => $owner->id, 'name' => 'Compartilhada', 'pet_type' => 'dog', 'duration_days' => 15]);
    $shared->ingredients()->attach($ingredient->id, ['quantity' => 0.3, 'unit' => 'kg']);

    $order = Order::create(['user_id' => $owner->id, 'total_price' => 20, 'status' => 'delivered']);
    $rexItem = OrderItem::create(['order_id' => $order->id, 'pet_id' => $rex->id, 'recipe_id' => $shared->id, 'unit_price' => 10, 'quantity' => 1]);
    $melItem = OrderItem::create(['order_id' => $order->id, 'pet_id' => $mel->id, 'recipe_id' => $shared->id, 'unit_price' => 10, 'quantity' => 1]);

    legacyPivot([[$rex->id, $shared->id], [$mel->id, $shared->id]]);
    recipeOwnershipMigration()->up();

    expect(Schema::hasTable('pet_recipe'))->toBeFalse()
        ->and($shared->fresh()->pet_id)->toBe($rex->id);

    $copy = Recipe::where('pet_id', $mel->id)->sole();
    expect($copy->id)->not->toBe($shared->id)
        ->and($copy->name)->toBe('Compartilhada')
        ->and($copy->user_id)->toBe($owner->id)
        ->and($copy->ingredients)->toHaveCount(1)
        ->and($rexItem->fresh()->recipe_id)->toBe($shared->id)
        ->and($melItem->fresh()->recipe_id)->toBe($copy->id);
});

test('a template linked to a pet stays in the catalog and the pet gets its own copy', function () {
    $owner = User::factory()->create();
    $rex = Pet::create(['user_id' => $owner->id, 'name' => 'Rex', 'type' => 'dog']);
    $template = Recipe::create(['name' => 'Modelo', 'pet_type' => 'all', 'is_template' => true]);

    legacyPivot([[$rex->id, $template->id]]);
    recipeOwnershipMigration()->up();

    expect($template->fresh()->pet_id)->toBeNull()
        ->and($template->fresh()->is_template)->toBeTrue();

    $copy = Recipe::where('pet_id', $rex->id)->sole();
    expect($copy->is_template)->toBeFalse()->and($copy->user_id)->toBe($owner->id);
});

test('a recipe without pets is left untouched and down() rebuilds the pivot', function () {
    $owner = User::factory()->create();
    $rex = Pet::create(['user_id' => $owner->id, 'name' => 'Rex', 'type' => 'dog']);
    $orphan = Recipe::create(['user_id' => $owner->id, 'name' => 'Solta', 'pet_type' => 'dog']);
    $linked = Recipe::create(['user_id' => $owner->id, 'name' => 'Do Rex', 'pet_type' => 'dog']);

    legacyPivot([[$rex->id, $linked->id]]);
    $migration = recipeOwnershipMigration();
    $migration->up();

    expect($orphan->fresh()->pet_id)->toBeNull()->and($linked->fresh()->pet_id)->toBe($rex->id);

    $migration->down();
    expect(DB::table('pet_recipe')->where('pet_id', $rex->id)->pluck('recipe_id')->all())->toBe([$linked->id]);

    Schema::drop('pet_recipe');
});
