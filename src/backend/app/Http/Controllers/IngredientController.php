<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Ingredient\StoreIngredientRequest;
use App\Http\Requests\Ingredient\UpdateIngredientRequest;
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
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $ingredients = Ingredient::all();
        } else {
            $ingredients = Ingredient::where('is_active', true)->get();
        }

        return $this->respondSuccess($ingredients, 'Ingredients fetched successfully');
    }

    /**
     * Create an ingredient (admin only).
     *
     * @param  StoreIngredientRequest  $request
     * @return JsonResponse
     */
    public function store(StoreIngredientRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['unit_cost'] = $validated['cost_per_unit'];

        $ingredient = Ingredient::create($validated);

        return $this->respondSuccess($ingredient, 'Ingredient created successfully', 201);
    }

    /**
     * Show an ingredient (admin only).
     *
     * @param  Request     $request
     * @param  Ingredient  $ingredient
     * @return JsonResponse
     */
    public function show(Request $request, Ingredient $ingredient): JsonResponse
    {
        $this->authorize('view', $ingredient);

        return $this->respondSuccess($ingredient, 'Ingredient fetched successfully');
    }

    /**
     * Update an ingredient (admin only).
     *
     * @param  UpdateIngredientRequest  $request
     * @param  Ingredient               $ingredient
     * @return JsonResponse
     */
    public function update(UpdateIngredientRequest $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['cost_per_unit'])) {
            $validated['unit_cost'] = $validated['cost_per_unit'];
        }

        $ingredient->update($validated);

        return $this->respondSuccess($ingredient, 'Ingredient updated successfully');
    }

    /**
     * Delete an ingredient (admin only).
     *
     * @param  Request     $request
     * @param  Ingredient  $ingredient
     * @return JsonResponse
     */
    public function destroy(Request $request, Ingredient $ingredient): JsonResponse
    {
        $this->authorize('delete', $ingredient);

        $ingredient->delete();

        return $this->respondSuccess(null, 'Ingredient deleted successfully');
    }
}
