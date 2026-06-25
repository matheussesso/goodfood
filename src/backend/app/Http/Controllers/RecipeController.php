<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $recipes = Recipe::with('ingredients')->get();

        return response()->json([
            'success' => true,
            'message' => 'Recipes fetched successfully',
            'data' => $recipes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'weight_per_portion' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'ingredients' => 'nullable|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
        ]);

        $recipe = Recipe::create($validated);

        if (!empty($validated['ingredients'])) {
            $syncData = [];
            foreach ($validated['ingredients'] as $ingredient) {
                $syncData[$ingredient['id']] = ['quantity' => $ingredient['quantity']];
            }
            $recipe->ingredients()->sync($syncData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recipe created successfully',
            'data' => $recipe->load('ingredients'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Recipe $recipe)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recipe fetched successfully',
            'data' => $recipe->load('ingredients'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Recipe $recipe)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'weight_per_portion' => 'sometimes|required|numeric|min:0',
            'is_active' => 'boolean',
            'ingredients' => 'nullable|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
        ]);

        $recipe->update($validated);

        if (isset($validated['ingredients'])) {
            $syncData = [];
            foreach ($validated['ingredients'] as $ingredient) {
                $syncData[$ingredient['id']] = ['quantity' => $ingredient['quantity']];
            }
            $recipe->ingredients()->sync($syncData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recipe updated successfully',
            'data' => $recipe->load('ingredients'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Recipe $recipe)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $recipe->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recipe deleted successfully',
            'data' => null,
        ]);
    }
}
