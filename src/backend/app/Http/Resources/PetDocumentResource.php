<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PetDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of a PetDocument. Exposes a public `file_url` built from
 * the stored `file_path`, matching the pet photo upload convention.
 *
 * @mixin PetDocument
 */
class PetDocumentResource extends JsonResource
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
            'category' => $this->category,
            'name' => $this->name,
            'file_url' => url('storage/'.$this->file_path),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
