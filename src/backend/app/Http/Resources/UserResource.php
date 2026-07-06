<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a User. Field list mirrors the previous direct model
 * serialization (minus hidden credentials) so the frontend contract is stable.
 *
 * @mixin User
 */
class UserResource extends JsonResource
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
            'email' => $this->email,
            'phone' => $this->phone,
            'street' => $this->street,
            'number' => $this->number,
            'complement' => $this->complement,
            'neighborhood' => $this->neighborhood,
            'city' => $this->city,
            'state' => $this->state,
            'zipcode' => $this->zipcode,
            'delivery_preferences' => $this->delivery_preferences,
            'role' => $this->role,
            'whatsapp_notifications' => $this->whatsapp_notifications,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pets' => PetResource::collection($this->whenLoaded('pets')),
            'orders' => OrderResource::collection($this->whenLoaded('orders')),
            'subscriptions' => SubscriptionResource::collection($this->whenLoaded('subscriptions')),
            'recipes' => RecipeResource::collection($this->whenLoaded('recipes')),
            'pets_count' => $this->whenCounted('pets'),
            'orders_count' => $this->whenCounted('orders'),
        ];
    }
}
