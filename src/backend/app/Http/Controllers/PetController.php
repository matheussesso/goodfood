<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Pet\StorePetRequest;
use App\Http\Requests\Pet\UpdatePetRequest;
use App\Http\Requests\Pet\UploadPetPhotoRequest;
use App\Http\Resources\PetResource;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages pet resources. Ownership rules live in PetPolicy.
 */
class PetController extends Controller
{
    /**
     * List pets: admins see all, customers see only their own.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $pets = Pet::with('user')->get();
        } else {
            $pets = $request->user()->pets()->with('recipes.ingredients')->get();
        }

        return $this->respondSuccess(PetResource::collection($pets), 'Pets fetched successfully');
    }

    /**
     * Create a pet. Admins may create on behalf of another user via user_id.
     */
    public function store(StorePetRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if ($request->user()->isAdmin() && isset($validated['user_id'])) {
            $owner = User::findOrFail($validated['user_id']);
        } else {
            $owner = $request->user();
        }

        $pet = $owner->pets()->create($validated);

        return $this->respondSuccess(PetResource::make($pet), 'Pet created successfully', 201);
    }

    /**
     * Show a pet with its recipes, orders and subscriptions.
     */
    public function show(Request $request, Pet $pet): JsonResponse
    {
        $this->authorize('view', $pet);

        return $this->respondSuccess(
            PetResource::make($pet->load(['recipes.ingredients', 'orders', 'subscriptions', 'vaccines', 'documents'])),
            'Pet fetched successfully'
        );
    }

    /**
     * Update a pet. Reassignment (user_id) is admin-only and stripped for
     * customers inside UpdatePetRequest::validated().
     */
    public function update(UpdatePetRequest $request, Pet $pet): JsonResponse
    {
        $pet->update($request->validated());

        return $this->respondSuccess(PetResource::make($pet), 'Pet updated successfully');
    }

    /**
     * Delete a pet.
     */
    public function destroy(Request $request, Pet $pet): JsonResponse
    {
        $this->authorize('delete', $pet);

        $pet->delete();

        return $this->respondSuccess(null, 'Pet deleted successfully');
    }

    /**
     * Upload a photo for a pet and return its URL.
     */
    public function uploadPhoto(UploadPetPhotoRequest $request): JsonResponse
    {
        $path = $request->file('photo')->store('pets', 'public');

        return $this->respondSuccess(
            ['photo_url' => url('storage/'.$path)],
            'Photo uploaded successfully'
        );
    }
}
