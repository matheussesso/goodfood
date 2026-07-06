<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of an Order with its items, invoice and relations.
 *
 * @mixin Order
 */
class OrderResource extends JsonResource
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
            'recipe_id' => $this->recipe_id,
            'subscription_id' => $this->subscription_id,
            'total_price' => $this->total_price,
            'status' => $this->status,
            'delivery_address' => $this->delivery_address,
            'delivery_date' => $this->delivery_date,
            'scheduled_reposicao_date' => $this->scheduled_reposicao_date,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'pet' => PetResource::make($this->whenLoaded('pet')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'subscription' => SubscriptionResource::make($this->whenLoaded('subscription')),
            'invoice' => InvoiceResource::make($this->whenLoaded('invoice')),
        ];
    }
}
