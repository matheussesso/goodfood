<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Recipe\CalculateRecipeCostRequest;
use App\Http\Requests\Recipe\CloneRecipeRequest;
use App\Http\Requests\Recipe\StoreRecipeRequest;
use App\Http\Requests\Recipe\UpdateRecipeRequest;
use App\Http\Resources\RecipeResource;
use App\Models\Pet;
use App\Models\Recipe;
use App\Services\RecipeCostCalculatorService;
use App\Services\RecipeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Manages recipes. A customer recipe always belongs to one of their pets;
 * catalog templates (admin) have no pet. Visibility/mutation rules live in
 * RecipePolicy.
 */
class RecipeController extends Controller
{
    public function __construct(private readonly RecipeService $recipes) {}

    /**
     * List recipes.
     *
     * Query filters: `templates=1` returns only active catalog templates;
     * `pet_id` returns only that pet's recipes. Without filters, admins get
     * everything and customers get templates plus the recipes of their pets.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Recipe::with(['ingredients', 'pet']);

        if ($request->boolean('templates')) {
            $query->where('is_template', true)->where('is_active', true);
        } elseif ($request->filled('pet_id')) {
            $pet = Pet::findOrFail((int) $request->query('pet_id'));
            $this->authorize('view', $pet);
            $query->where('pet_id', $pet->id);
        } elseif (! $user->isAdmin()) {
            $query->where(function ($scope) use ($user): void {
                $scope->where('is_template', true)
                    ->orWhereIn('pet_id', $user->pets()->select('id'));
            });
        }

        return $this->respondSuccess(RecipeResource::collection($query->orderBy('id')->get()), 'Recipes fetched successfully');
    }

    /**
     * Create a recipe for a pet (or, for admins, a catalog template).
     */
    public function store(StoreRecipeRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($user->isAdmin() && ($validated['is_template'] ?? false)) {
            $recipe = Recipe::create(array_diff_key($validated, array_flip(['ingredients', 'pet_id'])) + [
                'user_id' => $validated['user_id'] ?? $user->id,
            ]);
            $this->recipes->syncIngredients($recipe, $validated['ingredients'] ?? null);
            $recipe->updateBaseCost();
        } else {
            $pet = Pet::findOrFail($validated['pet_id']);
            $recipe = $this->recipes->createForPet($pet, $validated);
        }

        return $this->respondSuccess(
            RecipeResource::make($recipe->load(['ingredients', 'pet'])),
            'Recipe created successfully',
            201
        );
    }

    /**
     * Show a recipe with its ingredients and pet.
     */
    public function show(Request $request, Recipe $recipe): JsonResponse
    {
        $this->authorize('view', $recipe);

        return $this->respondSuccess(
            RecipeResource::make($recipe->load(['ingredients', 'pet'])),
            'Recipe fetched successfully'
        );
    }

    /**
     * Update a recipe. Ownership/template fields are stripped for customers
     * inside UpdateRecipeRequest::validated(); a recipe never changes pet.
     */
    public function update(UpdateRecipeRequest $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validated();

        $recipe->update(array_diff_key($validated, ['ingredients' => true]));
        $this->recipes->syncIngredients($recipe, $validated['ingredients'] ?? null);
        $recipe->updateBaseCost();

        return $this->respondSuccess(
            RecipeResource::make($recipe->load(['ingredients', 'pet'])),
            'Recipe updated successfully'
        );
    }

    /**
     * Delete a recipe, unless it is the pet's last one or part of an order.
     */
    public function destroy(Request $request, Recipe $recipe): JsonResponse
    {
        $this->authorize('delete', $recipe);

        if ($reason = $this->recipes->deletionBlocker($recipe)) {
            return $this->respondError($reason, 422);
        }

        $recipe->delete();

        return $this->respondSuccess(null, 'Recipe deleted successfully');
    }

    /**
     * Copy a recipe (usually a catalog template) into one of the user's pets.
     * The copy is private, never a template, and priced from today's costs.
     */
    public function clone(CloneRecipeRequest $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validated();
        $pet = Pet::findOrFail($validated['pet_id']);

        $copy = DB::transaction(fn (): Recipe => $this->recipes->copyToPet($recipe, $pet, $validated['name'] ?? null));

        return $this->respondSuccess(
            RecipeResource::make($copy->load(['ingredients', 'pet'])),
            'Recipe cloned successfully',
            201
        );
    }

    /**
     * Calculate cost dynamically without saving the recipe.
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
}
