<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a Subscription with its recipe rotation and orders.
 *
 * @mixin \App\Models\Subscription
 */
class SubscriptionResource extends JsonResource
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
            'id'                    => $this->id,
            'user_id'               => $this->user_id,
            'pet_id'                => $this->pet_id,
            'status'                => $this->status,
            'interval_days'         => $this->interval_days,
            'start_date'            => $this->start_date,
            'next_delivery_date'    => $this->next_delivery_date,
            'created_at'            => $this->created_at,
            'updated_at'            => $this->updated_at,
            'user'                  => UserResource::make($this->whenLoaded('user')),
            'pet'                   => PetResource::make($this->whenLoaded('pet')),
            'recipes'               => RecipeResource::collection($this->whenLoaded('recipes')),
            'orders'                => OrderResource::collection($this->whenLoaded('orders')),
            'orders_count'          => $this->whenCounted('orders'),
            'orders_max_created_at' => $this->whenAggregated('orders', 'created_at', 'max'),
        ];
    }
}
