<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PetVaccine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a PetVaccine.
 *
 * @mixin PetVaccine
 */
class PetVaccineResource extends JsonResource
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
            'pet_id' => $this->pet_id,
            'name' => $this->name,
            'application_date' => $this->application_date,
            'next_due_date' => $this->next_due_date,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
