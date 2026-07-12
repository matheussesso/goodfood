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
 * Manages subscription resources (fixed-duration weekly meal plans).
 * Ownership rules live in SubscriptionPolicy.
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
                ->latest()
                ->get();
        } else {
            $subscriptions = $request->user()
                ->subscriptions()
                ->with(['pet', 'recipes.ingredients'])
                ->latest()
                ->get();
        }

        return $this->respondSuccess(SubscriptionResource::collection($subscriptions), 'Subscriptions fetched successfully');
    }

    /**
     * Create a fixed-duration weekly meal plan for the authenticated user's
     * pet, with one recipe per 7-day block.
     */
    public function store(StoreSubscriptionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $pet = $request->user()->pets()->find($validated['pet_id']);
        if (! $pet) {
            return $this->respondError('Pet not found or unauthorized', 403);
        }

        $subscription = $request->user()->subscriptions()->create([
            'pet_id' => $validated['pet_id'],
            'duration_days' => $validated['duration_days'],
            'status' => 'active',
            'start_date' => Carbon::parse($validated['start_date']),
        ]);

        $this->syncRecipeRotation($subscription, $validated['recipe_ids']);

        return $this->respondSuccess(
            SubscriptionResource::make($subscription->load(['pet', 'recipes'])),
            'Subscription created successfully',
            201
        );
    }

    /**
     * Show a subscription with its pet and weekly recipes.
     */
    public function show(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);

        return $this->respondSuccess(
            SubscriptionResource::make($subscription->load(['pet', 'recipes'])),
            'Subscription fetched successfully'
        );
    }

    /**
     * Update a subscription's status, or replace its duration + recipe
     * rotation together (both are always sent atomically — see
     * UpdateSubscriptionRequest).
     */
    public function update(UpdateSubscriptionRequest $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validated();

        $subscription->update([
            'status' => $validated['status'] ?? $subscription->status,
            'duration_days' => $validated['duration_days'] ?? $subscription->duration_days,
        ]);

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
     * Replace the subscription's weekly recipes with the given ordered recipe ids.
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
