<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Ingredient\StoreIngredientRequest;
use App\Http\Requests\Ingredient\UpdateIngredientRequest;
use App\Http\Resources\IngredientResource;
use App\Models\Ingredient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages ingredient resources. Admin-only mutations enforced by
 * IngredientPolicy.
 */
class IngredientController extends Controller
{
    /**
     * List ingredients: admins see all, customers see only active ones.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $ingredients = Ingredient::all();
        } else {
            $ingredients = Ingredient::where('is_active', true)->get();
        }

        return $this->respondSuccess(IngredientResource::collection($ingredients), 'Ingredients fetched successfully');
    }

    /**
     * Create an ingredient (admin only).
     */
    public function store(StoreIngredientRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['unit_cost'] = $validated['cost_per_unit'];

        $ingredient = Ingredient::create($validated);

        return $this->respondSuccess(IngredientResource::make($ingredient), 'Ingredient created successfully', 201);
    }

    /**
     * Show an ingredient (admin only).
     */
    public function show(Request $request, Ingredient $ingredient): JsonResponse
    {
        $this->authorize('view', $ingredient);

        return $this->respondSuccess(IngredientResource::make($ingredient), 'Ingredient fetched successfully');
    }

    /**
     * Update an ingredient (admin only).
     */
    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['cost_per_unit'])) {
            $validated['unit_cost'] = $validated['cost_per_unit'];
        }

        $ingredient->update($validated);

        return $this->respondSuccess(IngredientResource::make($ingredient), 'Ingredient updated successfully');
    }

    /**
     * Delete an ingredient (admin only).
     */
    public function destroy(Request $request, Ingredient $ingredient): JsonResponse
    {
        $this->authorize('delete', $ingredient);

        $ingredient->delete();

        return $this->respondSuccess(null, 'Ingredient deleted successfully');
    }
}
