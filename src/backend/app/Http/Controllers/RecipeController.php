<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Recipe\CalculateRecipeCostRequest;
use App\Http\Requests\Recipe\StoreRecipeRequest;
use App\Http\Requests\Recipe\UpdateRecipeRequest;
use App\Models\Recipe;
use App\Services\RecipeCostCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages recipe resources. Visibility/mutation rules live in RecipePolicy.
 */
class RecipeController extends Controller
{
    /**
     * List recipes. Admins see all; customers see templates, their own
     * recipes, and recipes linked to their pets.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Recipe::with(['ingredients', 'pets']);

        if ($user->isAdmin()) {
            $recipes = $query->get();
        } else {
            $userPetIds = $user->pets()->pluck('id');
            $recipes = $query->where('is_template', true)
                             ->orWhere('user_id', $user->id)
                             ->orWhereHas('pets', function ($q) use ($userPetIds) {
                                 $q->whereIn('pets.id', $userPetIds);
                             })
                             ->distinct()
                             ->get();
        }

        return $this->respondSuccess($recipes, 'Recipes fetched successfully');
    }

    /**
     * Create a recipe, optionally syncing ingredients and linked pets.
     *
     * @param  StoreRecipeRequest  $request
     * @return JsonResponse
     */
    public function store(StoreRecipeRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (! $user->isAdmin()) {
            $validated['is_template'] = false;
            $validated['user_id'] = $user->id;
        } else {
            $validated['user_id'] = $validated['user_id'] ?? $user->id;
        }

        $recipe = Recipe::create($validated);

        $this->syncIngredients($recipe, $validated);

        if (isset($validated['pet_ids'])) {
            $recipe->pets()->sync($validated['pet_ids']);
        }

        $recipe->updateBaseCost();

        return $this->respondSuccess(
            $recipe->load(['ingredients', 'pets']),
            'Recipe created successfully',
            201
        );
    }

    /**
     * Show a recipe with its ingredients and linked pets.
     *
     * @param  Request  $request
     * @param  Recipe   $recipe
     * @return JsonResponse
     */
    public function show(Request $request, Recipe $recipe): JsonResponse
    {
        $this->authorize('view', $recipe);

        return $this->respondSuccess(
            $recipe->load(['ingredients', 'pets']),
            'Recipe fetched successfully'
        );
    }

    /**
     * Update a recipe. Ownership/template fields are stripped for customers
     * inside UpdateRecipeRequest::validated().
     *
     * @param  UpdateRecipeRequest  $request
     * @param  Recipe               $recipe
     * @return JsonResponse
     */
    public function update(UpdateRecipeRequest $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validated();

        $recipe->update($validated);

        $this->syncIngredients($recipe, $validated);

        if (isset($validated['pet_ids'])) {
            $recipe->pets()->sync($validated['pet_ids']);
        }

        $recipe->updateBaseCost();

        return $this->respondSuccess(
            $recipe->load(['ingredients', 'pets']),
            'Recipe updated successfully'
        );
    }

    /**
     * Delete a recipe.
     *
     * @param  Request  $request
     * @param  Recipe   $recipe
     * @return JsonResponse
     */
    public function destroy(Request $request, Recipe $recipe): JsonResponse
    {
        $this->authorize('delete', $recipe);

        $recipe->delete();

        return $this->respondSuccess(null, 'Recipe deleted successfully');
    }

    /**
     * Calculate cost dynamically without saving the recipe.
     *
     * @param  CalculateRecipeCostRequest   $request
     * @param  RecipeCostCalculatorService  $calculator
     * @return JsonResponse
     */
    public function calculateCost(CalculateRecipeCostRequest $request, RecipeCostCalculatorService $calculator): JsonResponse
    {
        $validated = $request->validated();

        $result = $calculator->calculateCost(
            $validated['ingredients'],
            $validated['duration_days'] ?? 15,
            $validated['daily_portions'] ?? 2
        );

        return $this->respondSuccess($result, 'Cost calculated successfully');
    }

    /**
     * Sync the recipe's ingredient pivot rows from a validated payload.
     *
     * @param  Recipe                $recipe
     * @param  array<string, mixed>  $validated
     * @return void
     */
    private function syncIngredients(Recipe $recipe, array $validated): void
    {
        if (! isset($validated['ingredients'])) {
            return;
        }

        $syncData = [];
        foreach ($validated['ingredients'] as $ingredient) {
            $syncData[$ingredient['id']] = [
                'quantity' => $ingredient['quantity'],
                'unit' => $ingredient['unit'] ?? 'kg',
            ];
        }

        $recipe->ingredients()->sync($syncData);
    }
}
