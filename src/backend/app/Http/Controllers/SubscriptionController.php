<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $subscriptions = Subscription::with(['user', 'pet', 'recipes.ingredients'])
                ->withCount('orders')
                ->withMax('orders', 'created_at')
                ->latest()
                ->get();
        } else {
            $subscriptions = $request->user()
                ->subscriptions()
                ->with(['pet', 'recipes.ingredients'])
                ->withCount('orders')
                ->withMax('orders', 'created_at')
                ->latest()
                ->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscriptions fetched successfully',
            'data' => $subscriptions,
        ]);
    }

    /**
     * Store a newly created resource in storage. Creates a subscription for the
     * authenticated user's pet, cycling through the given recipes in order.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pet_id' => 'required|exists:pets,id',
            'recipe_ids' => 'required|array|min:1',
            'recipe_ids.*' => 'required|integer|exists:recipes,id',
            'start_date' => 'required|date|after_or_equal:today',
            'interval_days' => 'required|integer|min:14|multiple_of:7',
        ]);

        $pet = $request->user()->pets()->find($validated['pet_id']);
        if (!$pet) {
            return response()->json(['success' => false, 'message' => 'Pet not found or unauthorized'], 403);
        }

        $startDate = Carbon::parse($validated['start_date']);

        $subscription = $request->user()->subscriptions()->create([
            'pet_id' => $validated['pet_id'],
            'interval_days' => $validated['interval_days'],
            'status' => 'active',
            'start_date' => $startDate,
            'next_delivery_date' => $startDate->copy()->addDays($validated['interval_days']),
        ]);

        $this->syncRecipeRotation($subscription, $validated['recipe_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription created successfully',
            'data' => $subscription->load(['pet', 'recipes']),
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  Request       $request
     * @param  Subscription  $subscription
     * @return JsonResponse
     */
    public function show(Request $request, Subscription $subscription): JsonResponse
    {
        if ($request->user()->id !== $subscription->user_id && !$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription fetched successfully',
            'data' => $subscription->load(['pet', 'recipes', 'orders']),
        ]);
    }

    /**
     * Update the specified resource in storage. Allows changing status, the recipe
     * rotation, or the cycle interval (the latter two recompute `next_delivery_date`).
     *
     * @param  Request       $request
     * @param  Subscription  $subscription
     * @return JsonResponse
     */
    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        if ($request->user()->id !== $subscription->user_id && !$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|required|in:active,paused,cancelled',
            'recipe_ids' => 'sometimes|required|array|min:1',
            'recipe_ids.*' => 'required_with:recipe_ids|integer|exists:recipes,id',
            'interval_days' => 'sometimes|required|integer|min:14|multiple_of:7',
        ]);

        $intervalChanged = array_key_exists('interval_days', $validated);

        $subscription->update([
            'status' => $validated['status'] ?? $subscription->status,
            'interval_days' => $validated['interval_days'] ?? $subscription->interval_days,
        ]);

        if ($intervalChanged) {
            $subscription->next_delivery_date = Carbon::today()->addDays($validated['interval_days']);
            $subscription->save();
        }

        if (array_key_exists('recipe_ids', $validated)) {
            $this->syncRecipeRotation($subscription, $validated['recipe_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription updated successfully',
            'data' => $subscription->load(['pet', 'recipes']),
        ]);
    }

    /**
     * Cancel the specified subscription. Preserves history (no hard delete).
     *
     * @param  Request       $request
     * @param  Subscription  $subscription
     * @return JsonResponse
     */
    public function destroy(Request $request, Subscription $subscription): JsonResponse
    {
        if ($request->user()->id !== $subscription->user_id && !$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $subscription->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription cancelled successfully',
            'data' => $subscription->load(['pet', 'recipes']),
        ]);
    }

    /**
     * Replace the subscription's recipe rotation with the given ordered recipe ids.
     *
     * @param  Subscription     $subscription
     * @param  array<int, int>  $recipeIds
     * @return void
     */
    private function syncRecipeRotation(Subscription $subscription, array $recipeIds): void
    {
        $subscription->recipes()->detach();

        foreach (array_values($recipeIds) as $position => $recipeId) {
            $subscription->recipes()->attach($recipeId, ['position' => $position]);
        }
    }
}
