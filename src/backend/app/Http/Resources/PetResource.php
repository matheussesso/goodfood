<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a Pet with (when loaded) its recipes, orders, health
 * records and owner.
 *
 * @mixin Pet
 */
class PetResource extends JsonResource
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
            'name' => $this->name,
            'type' => $this->type,
            'sex' => $this->sex,
            'breed' => $this->breed,
            'weight' => $this->weight,
            'age' => $this->age,
            'birth_date' => $this->birth_date,
            'restrictions' => $this->restrictions,
            'allergies' => $this->allergies,
            'special_needs' => $this->special_needs,
            'photo_url' => $this->photo_url,
            'neutered' => $this->neutered,
            'microchip_number' => $this->microchip_number,
            'vet_name' => $this->vet_name,
            'vet_phone' => $this->vet_phone,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'recipes' => RecipeResource::collection($this->whenLoaded('recipes')),
            'orders' => OrderResource::collection($this->whenLoaded('orders')),
            'vaccines' => PetVaccineResource::collection($this->whenLoaded('vaccines')),
            'documents' => PetDocumentResource::collection($this->whenLoaded('documents')),
        ];
    }
}
