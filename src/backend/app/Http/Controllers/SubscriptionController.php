<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->user()->isAdmin()) {
            $subscriptions = Subscription::with(['user', 'pet', 'recipe'])->latest()->get();
        } else {
            $subscriptions = $request->user()->subscriptions()->with(['pet', 'recipe'])->latest()->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscriptions fetched successfully',
            'data' => $subscriptions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => 'required|exists:pets,id',
            'recipe_id' => 'required|exists:recipes,id',
            'frequency' => 'required|in:weekly,biweekly,monthly',
            'start_date' => 'required|date|after_or_equal:today',
        ]);

        // Validate pet belongs to user
        $pet = $request->user()->pets()->find($validated['pet_id']);
        if (!$pet) {
            return response()->json(['message' => 'Pet not found or unauthorized'], 403);
        }

        $subscription = $request->user()->subscriptions()->create([
            'pet_id' => $validated['pet_id'],
            'recipe_id' => $validated['recipe_id'],
            'frequency' => $validated['frequency'],
            'status' => 'active',
            'start_date' => $validated['start_date'],
            'next_delivery_date' => $validated['start_date'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription created successfully',
            'data' => $subscription->load(['pet', 'recipe']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Subscription $subscription)
    {
        if ($request->user()->id !== $subscription->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription fetched successfully',
            'data' => $subscription->load(['pet', 'recipe', 'orders']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subscription $subscription)
    {
        if ($request->user()->id !== $subscription->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'frequency' => 'sometimes|required|in:weekly,biweekly,monthly',
            'status' => 'sometimes|required|in:active,paused,cancelled',
            'next_delivery_date' => 'sometimes|nullable|date',
        ]);

        $subscription->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subscription updated successfully',
            'data' => $subscription->load(['pet', 'recipe']),
        ]);
    }
}
