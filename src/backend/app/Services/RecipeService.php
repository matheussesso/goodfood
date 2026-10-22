<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Pet;
use App\Models\Recipe;

/**
 * Creates and copies customer recipes. A customer recipe always belongs to a
 * single pet (and to that pet's owner); catalog templates have no pet.
 */
class RecipeService
{
    /** Fields a recipe payload may set directly. */
    private const ATTRIBUTES = [
        'name',
        'description',
        'pet_type',
        'duration_days',
        'daily_portions',
        'instructions',
        'frequency',
        'is_active',
    ];

    /**
     * Create a recipe for a pet from a validated payload.
     *
     * @param  array<string, mixed>  $data  Recipe attributes plus an optional `ingredients` list.
     * @return Recipe The saved recipe with its cached cost refreshed.
     */
    public function createForPet(Pet $pet, array $data): Recipe
    {
        $recipe = Recipe::create(array_intersect_key($data, array_flip(self::ATTRIBUTES)) + [
            'pet_id' => $pet->id,
            'user_id' => $pet->user_id,
            'pet_type' => $pet->type,
            'is_template' => false,
            'is_active' => true,
        ]);

        $this->syncIngredients($recipe, $data['ingredients'] ?? null);
        $recipe->updateBaseCost();

        return $recipe;
    }

    /**
     * Copy a recipe (usually a catalog template) into a pet's private recipes.
     * Ownership, template flag and cached costs are never copied.
     *
     * @param  string|null  $name  Optional name for the copy (defaults to the source name).
     * @return Recipe The new recipe.
     */
    public function copyToPet(Recipe $source, Pet $pet, ?string $name = null): Recipe
    {
        $source->loadMissing('ingredients');

        $copy = Recipe::create([
            'user_id' => $pet->user_id,
            'pet_id' => $pet->id,
            'name' => $name ?: $source->name,
            'description' => $source->description,
            'pet_type' => $source->pet_type,
            'duration_days' => $source->duration_days,
            'daily_portions' => $source->daily_portions,
            'instructions' => $source->instructions,
            'frequency' => $source->frequency,
            'is_template' => false,
            'is_active' => true,
        ]);

        $copy->ingredients()->sync(
            $source->ingredients->mapWithKeys(fn ($ingredient) => [
                $ingredient->id => ['quantity' => $ingredient->pivot->quantity, 'unit' => $ingredient->pivot->unit],
            ])->all()
        );
        $copy->updateBaseCost();

        return $copy;
    }

    /**
     * Replace a recipe's ingredient rows. A null list leaves them untouched.
     *
     * @param  array<int, array{id: int, quantity: float|int|string, unit?: string|null}>|null  $ingredients
     */
    public function syncIngredients(Recipe $recipe, ?array $ingredients): void
    {
        if ($ingredients === null) {
            return;
        }

        $recipe->ingredients()->sync(
            collect($ingredients)->mapWithKeys(fn (array $item) => [
                $item['id'] => ['quantity' => $item['quantity'], 'unit' => $item['unit'] ?? 'kg'],
            ])->all()
        );
    }

    /**
     * Why a recipe cannot be deleted, or null when it can.
     *
     * The last recipe of a pet must stay (a pet always has a recipe), and a
     * recipe used in an order must stay so the order history keeps its items.
     */
    public function deletionBlocker(Recipe $recipe): ?string
    {
        if ($recipe->is_template || $recipe->pet_id === null) {
            return null;
        }

        if ($recipe->orderItems()->exists()) {
            return 'This recipe is part of an order and cannot be deleted.';
        }

        if (Recipe::where('pet_id', $recipe->pet_id)->whereKeyNot($recipe->getKey())->doesntExist()) {
            return 'A pet must keep at least one recipe.';
        }

        return null;
    }
}
