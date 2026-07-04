<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Recipe;
use App\Models\User;

/**
 * Authorization rules for Recipe resources. Admins may do anything.
 * Customers may view templates, their own recipes, or recipes linked to
 * their pets; they may only modify their own non-template recipes.
 */
class RecipePolicy
{
    /**
     * Grant every ability to admins before other checks run.
     *
     * @param  User    $user
     * @param  string  $ability
     * @return bool|null
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    /**
     * Determine whether the user can view the recipe.
     *
     * @param  User    $user
     * @param  Recipe  $recipe
     * @return bool
     */
    public function view(User $user, Recipe $recipe): bool
    {
        if ($recipe->is_template || $recipe->user_id === $user->id) {
            return true;
        }

        // Recipes linked to one of the user's pets are also visible.
        $recipe->loadMissing('pets');
        $userPetIds = $user->pets()->pluck('id');

        return $recipe->pets->pluck('id')->intersect($userPetIds)->isNotEmpty();
    }

    /**
     * Determine whether the user can update the recipe.
     * Customers cannot modify templates, even their own.
     *
     * @param  User    $user
     * @param  Recipe  $recipe
     * @return bool
     */
    public function update(User $user, Recipe $recipe): bool
    {
        return $recipe->user_id === $user->id && ! $recipe->is_template;
    }

    /**
     * Determine whether the user can delete the recipe.
     *
     * @param  User    $user
     * @param  Recipe  $recipe
     * @return bool
     */
    public function delete(User $user, Recipe $recipe): bool
    {
        return $recipe->user_id === $user->id;
    }
}
