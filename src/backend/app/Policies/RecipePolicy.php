<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Recipe;
use App\Models\User;

/**
 * Authorization rules for Recipe resources. Admins may do anything.
 * Customers may view catalog templates and the recipes of their own pets, and
 * may only change recipes of their own pets (never templates).
 */
class RecipePolicy
{
    /**
     * Grant every ability to admins before other checks run.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    /**
     * Determine whether the user can view the recipe.
     */
    public function view(User $user, Recipe $recipe): bool
    {
        return $recipe->is_template || $this->ownsRecipe($user, $recipe);
    }

    /**
     * Determine whether the user can update the recipe.
     * Customers cannot modify templates.
     */
    public function update(User $user, Recipe $recipe): bool
    {
        return ! $recipe->is_template && $this->ownsRecipe($user, $recipe);
    }

    /**
     * Determine whether the user can delete the recipe.
     */
    public function delete(User $user, Recipe $recipe): bool
    {
        return ! $recipe->is_template && $this->ownsRecipe($user, $recipe);
    }

    /**
     * A recipe is the user's when it belongs to one of their pets. Legacy
     * recipes without a pet fall back to the `user_id` owner.
     */
    private function ownsRecipe(User $user, Recipe $recipe): bool
    {
        if ($recipe->pet_id !== null) {
            $recipe->loadMissing('pet');

            return $recipe->pet?->user_id === $user->id;
        }

        return $recipe->user_id === $user->id;
    }
}
