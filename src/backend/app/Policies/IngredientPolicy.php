<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Ingredient;
use App\Models\User;

/**
 * Authorization rules for Ingredient resources: everyone authenticated may
 * list active ingredients; only admins may view details or mutate.
 */
class IngredientPolicy
{
    /**
     * Determine whether the user can view any ingredients (listing).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the ingredient.
     */
    public function view(User $user, Ingredient $ingredient): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can create ingredients.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the ingredient.
     */
    public function update(User $user, Ingredient $ingredient): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the ingredient.
     */
    public function delete(User $user, Ingredient $ingredient): bool
    {
        return $user->isAdmin();
    }
}
