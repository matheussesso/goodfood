<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a Recipe with its ingredient/pet relations. Includes
 * the subscription_recipes pivot (position) when nested under a subscription.
 *
 * @mixin \App\Models\Recipe
 */
class RecipeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'pet_id'          => $this->pet_id,
            'name'            => $this->name,
            'description'     => $this->description,
            'pet_type'        => $this->pet_type,
            'duration_days'   => $this->duration_days,
            'daily_portions'  => $this->daily_portions,
            'instructions'    => $this->instructions,
            'is_template'     => $this->is_template,
            'frequency'       => $this->frequency,
            'base_cost'       => $this->base_cost,
            'ingredient_cost' => $this->ingredient_cost,
            'is_active'       => $this->is_active,
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
            'user'            => UserResource::make($this->whenLoaded('user')),
            'pets'            => PetResource::collection($this->whenLoaded('pets')),
            'ingredients'     => IngredientResource::collection($this->whenLoaded('ingredients')),
            'pivot'           => $this->when($this->resource->pivot !== null, fn () => $this->resource->pivot),
        ];
    }
}
