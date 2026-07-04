<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of an OrderItem with its recipe/pet relations.
 *
 * @mixin \App\Models\OrderItem
 */
class OrderItemResource extends JsonResource
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
            'id'         => $this->id,
            'order_id'   => $this->order_id,
            'recipe_id'  => $this->recipe_id,
            'pet_id'     => $this->pet_id,
            'unit_price' => $this->unit_price,
            'quantity'   => $this->quantity,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'recipe'     => RecipeResource::make($this->whenLoaded('recipe')),
            'pet'        => PetResource::make($this->whenLoaded('pet')),
        ];
    }
}
