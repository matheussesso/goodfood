<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Admin can see all pets, customer can see only theirs
        if ($request->user()->isAdmin()) {
            $pets = Pet::with('user')->get();
        } else {
            $pets = $request->user()->pets()->with('recipes')->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Pets fetched successfully',
            'data' => $pets,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|in:dog,cat',
            'breed' => 'nullable|string|max:255',
            'weight' => 'nullable|numeric|min:0',
            'age' => 'nullable|integer|min:0',
            'birth_date' => 'nullable|date',
            'restrictions' => 'nullable|string',
            'allergies' => 'nullable|string',
            'special_needs' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($request->user()->isAdmin() && isset($validated['user_id'])) {
            $user = \App\Models\User::findOrFail($validated['user_id']);
            $pet = $user->pets()->create($validated);
        } else {
            $pet = $request->user()->pets()->create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pet created successfully',
            'data' => $pet,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Pet $pet)
    {
        if ($request->user()->id !== $pet->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pet fetched successfully',
            'data' => $pet->load(['recipes.ingredients', 'orders', 'subscriptions']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Pet $pet)
    {
        if ($request->user()->id !== $pet->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'nullable|string|in:dog,cat',
            'breed' => 'nullable|string|max:255',
            'weight' => 'nullable|numeric|min:0',
            'age' => 'nullable|integer|min:0',
            'birth_date' => 'nullable|date',
            'restrictions' => 'nullable|string',
            'allergies' => 'nullable|string',
            'special_needs' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($request->user()->isAdmin() && isset($validated['user_id'])) {
            $pet->user_id = $validated['user_id'];
        }

        $pet->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pet updated successfully',
            'data' => $pet,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Pet $pet)
    {
        if ($request->user()->id !== $pet->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pet->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pet deleted successfully',
            'data' => null,
        ]);
    }

    /**
     * Upload a photo for a pet and return its URL.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $path = $request->file('photo')->store('pets', 'public');

        return response()->json([
            'success' => true,
            'photo_url' => url('storage/' . $path),
        ]);
    }
}
