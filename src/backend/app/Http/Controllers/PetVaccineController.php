<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Pet\StoreVaccineRequest;
use App\Http\Requests\Pet\UpdateVaccineRequest;
use App\Http\Resources\PetVaccineResource;
use App\Models\Pet;
use App\Models\PetVaccine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages vaccination records nested under a pet. Ownership rules mirror
 * PetPolicy (owner or admin) via the parent pet.
 */
class PetVaccineController extends Controller
{
    /**
     * Add a vaccination record to the pet.
     */
    public function store(StoreVaccineRequest $request, Pet $pet): JsonResponse
    {
        $vaccine = $pet->vaccines()->create($request->validated());

        return $this->respondSuccess(PetVaccineResource::make($vaccine), 'Vaccine added successfully', 201);
    }

    /**
     * Update a vaccination record.
     */
    public function update(UpdateVaccineRequest $request, Pet $pet, PetVaccine $vaccine): JsonResponse
    {
        abort_unless($vaccine->pet_id === $pet->id, 404);

        $vaccine->update($request->validated());

        return $this->respondSuccess(PetVaccineResource::make($vaccine), 'Vaccine updated successfully');
    }

    /**
     * Delete a vaccination record.
     */
    public function destroy(Request $request, Pet $pet, PetVaccine $vaccine): JsonResponse
    {
        $this->authorize('update', $pet);
        abort_unless($vaccine->pet_id === $pet->id, 404);

        $vaccine->delete();

        return $this->respondSuccess(null, 'Vaccine deleted successfully');
    }
}
