<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a Subscription: a fixed-duration weekly meal plan.
 *
 * @mixin Subscription
 */
class SubscriptionResource extends JsonResource
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
            'user_id' => $this->user_id,
            'pet_id' => $this->pet_id,
            'status' => $this->status,
            'duration_days' => $this->duration_days,
            'total_cycles' => $this->total_cycles,
            'current_cycle_index' => $this->current_cycle_index,
            'estimated_price' => $this->estimated_price,
            'start_date' => $this->start_date,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'pet' => PetResource::make($this->whenLoaded('pet')),
            'recipes' => RecipeResource::collection($this->whenLoaded('recipes')),
        ];
    }
}
