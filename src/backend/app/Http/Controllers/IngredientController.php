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
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ingredients = Ingredient::all();

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
            'description' => 'nullable|string',
            'unit' => 'required|string|in:kg,g,unit,l,ml',
            'unit_cost' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

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
            'description' => 'nullable|string',
            'unit' => 'sometimes|required|string|in:kg,g,unit,l,ml',
            'unit_cost' => 'sometimes|required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

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
