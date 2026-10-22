<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Recipes stop being shared between pets: every customer recipe now belongs to
 * exactly one pet through `recipes.pet_id`, and the `pet_recipe` pivot goes away.
 *
 * Data moved from the pivot:
 * - customer recipe linked to one pet → `pet_id` of that pet;
 * - customer recipe linked to N pets → the original stays with the first pet and
 *   each other pet gets a copy (with its ingredients); that pet's order items are
 *   re-pointed to its copy;
 * - catalog template linked to pets → a private copy per pet (the template stays);
 * - customer recipe linked to no pet → left untouched (`pet_id` null, hidden in
 *   the app); order history keeps working.
 *
 * Uses the query builder only, so it does not depend on the current models.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('pet_recipe')) {
            return;
        }

        $links = DB::table('pet_recipe')->orderBy('id')->get()->groupBy('recipe_id');

        foreach ($links as $recipeId => $rows) {
            $recipe = DB::table('recipes')->where('id', $recipeId)->first();
            if ($recipe === null) {
                continue;
            }

            $petIds = $rows->pluck('pet_id')->unique()->values();

            if ($recipe->is_template) {
                foreach ($petIds as $petId) {
                    $this->copyRecipeToPet($recipe, (int) $petId);
                }

                continue;
            }

            $firstPetId = (int) $petIds->shift();
            DB::table('recipes')->where('id', $recipe->id)->update([
                'pet_id' => $firstPetId,
                'user_id' => $recipe->user_id ?? $this->ownerOf($firstPetId),
            ]);

            foreach ($petIds as $petId) {
                $copyId = $this->copyRecipeToPet($recipe, (int) $petId);

                DB::table('order_items')
                    ->where('recipe_id', $recipe->id)
                    ->where('pet_id', $petId)
                    ->update(['recipe_id' => $copyId]);
            }
        }

        Schema::drop('pet_recipe');
    }

    /**
     * Reverse the migrations: rebuild the pivot from `recipes.pet_id`.
     * Copies created by up() remain as separate recipes.
     */
    public function down(): void
    {
        if (Schema::hasTable('pet_recipe')) {
            return;
        }

        Schema::create('pet_recipe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['pet_id', 'recipe_id']);
        });

        $now = Carbon::now();
        DB::table('recipes')->whereNotNull('pet_id')->orderBy('id')->each(function (object $recipe) use ($now): void {
            DB::table('pet_recipe')->insert([
                'pet_id' => $recipe->pet_id,
                'recipe_id' => $recipe->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });
    }

    /**
     * Copy a recipe (and its ingredient rows) as a private recipe of the given pet.
     *
     * @return int Id of the new recipe.
     */
    private function copyRecipeToPet(object $recipe, int $petId): int
    {
        $now = Carbon::now();

        $copyId = (int) DB::table('recipes')->insertGetId([
            'user_id' => $this->ownerOf($petId),
            'pet_id' => $petId,
            'name' => $recipe->name,
            'description' => $recipe->description,
            'pet_type' => $recipe->pet_type,
            'duration_days' => $recipe->duration_days,
            'daily_portions' => $recipe->daily_portions,
            'instructions' => $recipe->instructions,
            'is_template' => false,
            'frequency' => $recipe->frequency,
            'base_cost' => $recipe->base_cost,
            'ingredient_cost' => $recipe->ingredient_cost,
            'is_active' => $recipe->is_active,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $ingredients = DB::table('ingredient_recipe')->where('recipe_id', $recipe->id)->get();
        foreach ($ingredients as $row) {
            DB::table('ingredient_recipe')->insert([
                'ingredient_id' => $row->ingredient_id,
                'recipe_id' => $copyId,
                'quantity' => $row->quantity,
                'unit' => $row->unit,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        return $copyId;
    }

    /**
     * Owner (user id) of a pet.
     */
    private function ownerOf(int $petId): ?int
    {
        $userId = DB::table('pets')->where('id', $petId)->value('user_id');

        return $userId === null ? null : (int) $userId;
    }
};
