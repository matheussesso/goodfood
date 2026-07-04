<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Pet\StorePetRequest;
use App\Http\Requests\Pet\UpdatePetRequest;
use App\Http\Requests\Pet\UploadPetPhotoRequest;
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
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $pets = Pet::with('user')->get();
        } else {
            $pets = $request->user()->pets()->with('recipes.ingredients')->get();
        }

        return $this->respondSuccess($pets, 'Pets fetched successfully');
    }

    /**
     * Create a pet. Admins may create on behalf of another user via user_id.
     *
     * @param  StorePetRequest  $request
     * @return JsonResponse
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

        return $this->respondSuccess($pet, 'Pet created successfully', 201);
    }

    /**
     * Show a pet with its recipes, orders and subscriptions.
     *
     * @param  Request  $request
     * @param  Pet      $pet
     * @return JsonResponse
     */
    public function show(Request $request, Pet $pet): JsonResponse
    {
        $this->authorize('view', $pet);

        return $this->respondSuccess(
            $pet->load(['recipes.ingredients', 'orders', 'subscriptions']),
            'Pet fetched successfully'
        );
    }

    /**
     * Update a pet. Reassignment (user_id) is admin-only and stripped for
     * customers inside UpdatePetRequest::validated().
     *
     * @param  UpdatePetRequest  $request
     * @param  Pet               $pet
     * @return JsonResponse
     */
    public function update(UpdatePetRequest $request, Pet $pet): JsonResponse
    {
        $pet->update($request->validated());

        return $this->respondSuccess($pet, 'Pet updated successfully');
    }

    /**
     * Delete a pet.
     *
     * @param  Request  $request
     * @param  Pet      $pet
     * @return JsonResponse
     */
    public function destroy(Request $request, Pet $pet): JsonResponse
    {
        $this->authorize('delete', $pet);

        $pet->delete();

        return $this->respondSuccess(null, 'Pet deleted successfully');
    }

    /**
     * Upload a photo for a pet and return its URL.
     *
     * @param  UploadPetPhotoRequest  $request
     * @return JsonResponse
     */
    public function uploadPhoto(UploadPetPhotoRequest $request): JsonResponse
    {
        $path = $request->file('photo')->store('pets', 'public');

        return $this->respondSuccess(
            ['photo_url' => url('storage/' . $path)],
            'Photo uploaded successfully'
        );
    }
}
