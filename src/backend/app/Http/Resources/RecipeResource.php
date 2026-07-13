<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Recipe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a Recipe with its ingredient/pet relations. Includes
 * the subscription_recipes pivot (position) when nested under a subscription.
 *
 * @mixin Recipe
 */
class RecipeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Ingredient prices change over time, so cost is always priced live from
        // the currently loaded ingredients rather than trusting the cached
        // base_cost/ingredient_cost columns (which are only a snapshot from the
        // last time this recipe was saved). Falls back to the cached columns
        // only when ingredients weren't eager-loaded for this response.
        $liveCost = $this->relationLoaded('ingredients') ? $this->calculateCostResult() : null;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'pet_id' => $this->pet_id,
            'name' => $this->name,
            'description' => $this->description,
            'pet_type' => $this->pet_type,
            'duration_days' => $this->duration_days,
            'daily_portions' => $this->daily_portions,
            'instructions' => $this->instructions,
            'is_template' => $this->is_template,
            'frequency' => $this->frequency,
            'base_cost' => $liveCost['estimatedCost'] ?? $this->base_cost,
            'ingredient_cost' => $liveCost['ingredientCost'] ?? $this->ingredient_cost,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'pets' => PetResource::collection($this->whenLoaded('pets')),
            'ingredients' => IngredientResource::collection($this->whenLoaded('ingredients')),
            'pivot' => $this->when($this->resource->pivot !== null, fn () => $this->resource->pivot),
        ];
    }
}
