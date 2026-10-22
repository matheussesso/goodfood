<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
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
            $orders = Order::with(['user', 'pet', 'items.recipe.ingredients', 'items.pet', 'invoice'])->latest()->get();
        } else {
            $orders = $request->user()
                ->orders()
                ->with(['pet', 'items.recipe.ingredients', 'items.pet', 'invoice'])
                ->latest()
                ->get();
        }

        return $this->respondSuccess(OrderResource::collection($orders), 'Orders fetched successfully');
    }

    /**
     * Create a new order (a meal plan) for the authenticated user. Validation,
     * pet ownership and recipe/pet consistency live in StoreOrderRequest.
     */
    public function store(StoreOrderRequest $request, OrderService $orders): JsonResponse
    {
        $validated = $request->validated();

        $order = $orders->place($request->user(), $validated['items'], $validated['delivery_address'] ?? null);

        return $this->respondSuccess(OrderResource::make($order), 'Order created successfully', 201);
    }

    /**
     * Return a single order.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        return $this->respondSuccess(
            OrderResource::make($order->load(['user', 'pet', 'items.recipe.ingredients', 'items.pet', 'invoice'])),
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
            OrderResource::make($order->load(['user', 'pet', 'items.recipe.ingredients'])),
            'Order updated successfully'
        );
    }
}
