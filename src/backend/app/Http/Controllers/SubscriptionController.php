<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Subscription\StoreSubscriptionRequest;
use App\Http\Requests\Subscription\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages subscription resources. Ownership rules live in SubscriptionPolicy.
 */
class SubscriptionController extends Controller
{
    /**
     * List subscriptions: admins see all, customers see only their own.
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

        return $this->respondSuccess(SubscriptionResource::collection($subscriptions), 'Subscriptions fetched successfully');
    }

    /**
     * Create a subscription for the authenticated user's pet, cycling
     * through the given recipes in order.
     */
    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $pet = $request->user()->pets()->find($validated['pet_id']);
        if (! $pet) {
            return $this->respondError('Pet not found or unauthorized', 403);
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

        return $this->respondSuccess(
            SubscriptionResource::make($subscription->load(['pet', 'recipes'])),
            'Subscription created successfully',
            201
        );
    }

    /**
     * Show a subscription with its pet, recipes and orders.
     */
    public function show(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);

        return $this->respondSuccess(
            SubscriptionResource::make($subscription->load(['pet', 'recipes', 'orders'])),
            'Subscription fetched successfully'
        );
    }

    /**
     * Update a subscription: status, recipe rotation, or cycle interval
     * (the latter two recompute `next_delivery_date`).
     */
    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validated();

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

        return $this->respondSuccess(
            SubscriptionResource::make($subscription->load(['pet', 'recipes'])),
            'Subscription updated successfully'
        );
    }

    /**
     * Cancel the specified subscription. Preserves history (no hard delete).
     */
    public function destroy(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('delete', $subscription);

        $subscription->update(['status' => 'cancelled']);

        return $this->respondSuccess(
            SubscriptionResource::make($subscription->load(['pet', 'recipes'])),
            'Subscription cancelled successfully'
        );
    }

    /**
     * Replace the subscription's recipe rotation with the given ordered recipe ids.
     *
     * @param  array<int, int>  $recipeIds
     */
    private function syncRecipeRotation(Subscription $subscription, array $recipeIds): void
    {
        $subscription->recipes()->detach();

        foreach (array_values($recipeIds) as $position => $recipeId) {
            $subscription->recipes()->attach($recipeId, ['position' => $position]);
        }
    }
}
