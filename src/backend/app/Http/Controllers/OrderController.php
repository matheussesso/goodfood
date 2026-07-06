<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Recipe;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages order resources. Ownership rules live in OrderPolicy.
 */
class OrderController extends Controller
{
    /**
     * Return all orders.
     * Admins see every order; customers see only their own.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $orders = Order::with(['user', 'pet', 'items.recipe.ingredients', 'items.pet', 'subscription', 'invoice'])->latest()->get();
        } else {
            $orders = $request->user()
                ->orders()
                ->with(['pet', 'items.recipe.ingredients', 'items.pet', 'subscription', 'invoice'])
                ->latest()
                ->get();
        }

        return $this->respondSuccess(OrderResource::collection($orders), 'Orders fetched successfully');
    }

    /**
     * Create a new order for the authenticated user.
     * Accepts an array of items (each with recipe_id and optional pet_id),
     * allowing the same recipe to appear multiple times for different pets.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $userPetIds = $request->user()->pets()->pluck('id');
        foreach ($validated['items'] as $item) {
            if (! empty($item['pet_id']) && ! $userPetIds->contains($item['pet_id'])) {
                return $this->respondError('Pet not found or unauthorized', 403);
            }
        }

        $recipeIds = collect($validated['items'])->pluck('recipe_id');
        $recipesById = Recipe::with('ingredients')->whereIn('id', $recipeIds->unique())->get()->keyBy('id');

        $total = collect($validated['items'])->sum(function (array $item) use ($recipesById): float {
            /** @var Recipe|null $recipe */
            $recipe = $recipesById->get($item['recipe_id']);

            return (float) ($recipe?->calculateTotalCost() ?? 0);
        });

        $order = $request->user()->orders()->create([
            'total_price' => $total,
            'status' => 'pending_payment',
            'delivery_address' => $validated['delivery_address'] ?? null,
        ]);

        Invoice::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'amount' => $total,
            'status' => 'pending',
            'due_date' => Carbon::today()->addDays(3),
        ]);

        foreach ($validated['items'] as $item) {
            /** @var Recipe|null $recipe */
            $recipe = $recipesById->get($item['recipe_id']);
            $currentPrice = (float) ($recipe?->calculateTotalCost() ?? 0);
            OrderItem::create([
                'order_id' => $order->id,
                'pet_id' => $item['pet_id'] ?? null,
                'recipe_id' => $item['recipe_id'],
                'unit_price' => $currentPrice,
                'quantity' => 1,
            ]);
        }

        return $this->respondSuccess(
            OrderResource::make($order->load(['items.recipe', 'items.pet', 'invoice'])),
            'Order created successfully',
            201
        );
    }

    /**
     * Return a single order.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        return $this->respondSuccess(
            OrderResource::make($order->load(['user', 'pet', 'items.recipe.ingredients', 'items.pet', 'subscription', 'invoice'])),
            'Order fetched successfully'
        );
    }

    /**
     * Update an order. Customers may update delivery fields; admins may also
     * update status. Rules and authorization live in UpdateOrderRequest.
     */
    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        $order->update($request->validated());

        return $this->respondSuccess(
            OrderResource::make($order->load(['user', 'pet', 'items.recipe'])),
            'Order updated successfully'
        );
    }
}
