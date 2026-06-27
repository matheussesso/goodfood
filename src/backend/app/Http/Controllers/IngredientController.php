<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $ingredients = Ingredient::all();
        } else {
            $ingredients = Ingredient::where('is_active', true)->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Ingredients fetched successfully',
            'data' => $ingredients,
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
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'required|string',
            'cost_per_unit' => 'required|numeric|min:0',
            'loss_rate' => 'nullable|numeric|min:0',
            'difficulty_multiplier' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['unit_cost'] = $validated['cost_per_unit'];

        $ingredient = Ingredient::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ingredient created successfully',
            'data' => $ingredient,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Ingredient $ingredient)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ingredient fetched successfully',
            'data' => $ingredient,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ingredient $ingredient)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'sometimes|required|string',
            'cost_per_unit' => 'sometimes|required|numeric|min:0',
            'loss_rate' => 'nullable|numeric|min:0',
            'difficulty_multiplier' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['unit_cost'] = $validated['cost_per_unit'];

        $ingredient->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ingredient updated successfully',
            'data' => $ingredient,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Ingredient $ingredient)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ingredient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ingredient deleted successfully',
            'data' => null,
        ]);
    }
}
