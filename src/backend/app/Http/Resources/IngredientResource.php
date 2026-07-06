<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of an Ingredient. Includes the ingredient_recipe pivot
 * (quantity/unit) when nested under a recipe.
 *
 * @mixin Ingredient
 */
class IngredientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'unit' => $this->unit,
            'unit_cost' => $this->unit_cost,
            'cost_per_unit' => $this->cost_per_unit,
            'loss_rate' => $this->loss_rate,
            'difficulty_multiplier' => $this->difficulty_multiplier,
            'category' => $this->category,
            'stock_quantity' => $this->stock_quantity,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pivot' => $this->when($this->resource->pivot !== null, fn () => $this->resource->pivot),
        ];
    }
}
