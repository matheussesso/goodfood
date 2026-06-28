<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Services\RecipeCostCalculatorService;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Recipe::with(['ingredients', 'pets']);

        if ($user->role === 'admin') {
            // Admin sees all recipes
            $recipes = $query->get();
        } else {
            // Customer sees templates, their own recipes, or recipes linked to their pets.
            $userPetIds = $user->pets()->pluck('id');
            $recipes = $query->where('is_template', true)
                             ->orWhere('user_id', $user->id)
                             ->orWhereHas('pets', function ($q) use ($userPetIds) {
                                 $q->whereIn('pets.id', $userPetIds);
                             })
                             ->distinct()
                             ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $recipes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'pet_type' => 'nullable|string',
            'duration_days' => 'nullable|integer|min:1',
            'daily_portions' => 'nullable|integer|min:1',
            'instructions' => 'nullable|string',
            'is_template' => 'boolean',
            'frequency' => 'nullable|string',
            'is_active' => 'boolean',
            'pet_id' => 'nullable|exists:pets,id',
            'pet_ids' => 'nullable|array',
            'pet_ids.*' => 'exists:pets,id',
            'ingredients' => 'nullable|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.unit' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($user->role !== 'admin') {
            $validated['is_template'] = false;
            $validated['user_id'] = $user->id;
        } else {
            $validated['user_id'] = $validated['user_id'] ?? $user->id;
        }

        $recipe = Recipe::create($validated);

        if (!empty($validated['ingredients'])) {
            $syncData = [];
            foreach ($validated['ingredients'] as $ingredient) {
                $syncData[$ingredient['id']] = [
                    'quantity' => $ingredient['quantity'],
                    'unit' => $ingredient['unit'] ?? 'kg'
                ];
            }
            $recipe->ingredients()->sync($syncData);
        }

        if (isset($validated['pet_ids'])) {
            $recipe->pets()->sync($validated['pet_ids']);
        }

        $recipe->updateBaseCost();

        return response()->json([
            'success' => true,
            'message' => 'Recipe created successfully',
            'data' => $recipe->load(['ingredients', 'pets']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Recipe $recipe)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && !$recipe->is_template && $recipe->user_id !== $user->id) {
            // Also allow if the recipe is linked to one of the user's pets.
            $recipe->loadMissing('pets');
            $userPetIds = $user->pets()->pluck('id');
            if ($recipe->pets->pluck('id')->intersect($userPetIds)->isEmpty()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $recipe->load(['ingredients', 'pets']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Recipe $recipe)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $recipe->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role !== 'admin' && $recipe->is_template) {
             return response()->json(['message' => 'Cannot modify a template.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'pet_type' => 'nullable|string',
            'duration_days' => 'nullable|integer|min:1',
            'daily_portions' => 'nullable|integer|min:1',
            'instructions' => 'nullable|string',
            'is_template' => 'boolean',
            'frequency' => 'nullable|string',
            'is_active' => 'boolean',
            'pet_id' => 'nullable|exists:pets,id',
            'pet_ids' => 'nullable|array',
            'pet_ids.*' => 'exists:pets,id',
            'ingredients' => 'nullable|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.unit' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($user->role !== 'admin' && isset($validated['is_template'])) {
            unset($validated['is_template']); // Customers cannot change to template
        }

        $recipe->update($validated);

        if (isset($validated['ingredients'])) {
            $syncData = [];
            foreach ($validated['ingredients'] as $ingredient) {
                $syncData[$ingredient['id']] = [
                    'quantity' => $ingredient['quantity'],
                    'unit' => $ingredient['unit'] ?? 'kg'
                ];
            }
            $recipe->ingredients()->sync($syncData);
        }

        if (isset($validated['pet_ids'])) {
            $recipe->pets()->sync($validated['pet_ids']);
        }

        $recipe->updateBaseCost();

        return response()->json([
            'success' => true,
            'message' => 'Recipe updated successfully',
            'data' => $recipe->load(['ingredients', 'pets']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Recipe $recipe)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $recipe->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $recipe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recipe deleted successfully',
        ]);
    }

    /**
     * Calculate cost dynamically without saving the recipe.
     */
    public function calculateCost(Request $request, RecipeCostCalculatorService $calculator)
    {
        $validated = $request->validate([
            'ingredients' => 'required|array',
            'ingredients.*.ingredient_id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.unit' => 'nullable|string',
            'duration_days' => 'nullable|integer|min:1',
            'daily_portions' => 'nullable|integer|min:1',
        ]);

        $durationDays = $validated['duration_days'] ?? 15;
        $dailyPortions = $validated['daily_portions'] ?? 2;

        $result = $calculator->calculateCost(
            $validated['ingredients'],
            $durationDays,
            $dailyPortions
        );

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }
}
