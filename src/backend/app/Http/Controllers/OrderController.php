<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Return all orders.
     * Admins see every order; customers see only their own.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isAdmin()) {
            $orders = Order::with(['user', 'pet', 'items.recipe', 'subscription'])->latest()->get();
        } else {
            $orders = $request->user()
                ->orders()
                ->with(['pet', 'items.recipe', 'subscription'])
                ->latest()
                ->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Orders fetched successfully',
            'data' => $orders,
        ]);
    }

    /**
     * Create a new order for the authenticated user.
     * Accepts one or more recipe_ids, computes total from recipe base_cost.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pet_id'           => 'nullable|exists:pets,id',
            'recipe_ids'       => 'required|array|min:1',
            'recipe_ids.*'     => 'integer|exists:recipes,id',
            'delivery_address' => 'nullable|string|max:500',
            'delivery_date'    => 'nullable|date|after:today',
        ]);

        if (!empty($validated['pet_id'])) {
            $pet = $request->user()->pets()->find($validated['pet_id']);
            if (!$pet) {
                return response()->json(['success' => false, 'message' => 'Pet not found or unauthorized'], 403);
            }
        }

        $recipes = Recipe::whereIn('id', $validated['recipe_ids'])->get();
        if ($recipes->count() !== count($validated['recipe_ids'])) {
            return response()->json(['success' => false, 'message' => 'One or more recipes not found'], 422);
        }

        $total = $recipes->sum(fn(Recipe $r) => (float) ($r->base_cost ?? 0));

        $order = $request->user()->orders()->create([
            'pet_id'           => $validated['pet_id'],
            'total_price'      => $total,
            'status'           => 'pending',
            'delivery_address' => $validated['delivery_address'] ?? null,
            'delivery_date'    => $validated['delivery_date'] ?? null,
        ]);

        foreach ($recipes as $recipe) {
            OrderItem::create([
                'order_id'   => $order->id,
                'recipe_id'  => $recipe->id,
                'unit_price' => (float) ($recipe->base_cost ?? 0),
                'quantity'   => 1,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data'    => $order->load(['pet', 'items.recipe']),
        ], 201);
    }

    /**
     * Return a single order.
     *
     * @param  Request  $request
     * @param  Order    $order
     * @return JsonResponse
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        if ($request->user()->id !== $order->user_id && !$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order fetched successfully',
            'data'    => $order->load(['user', 'pet', 'items.recipe', 'subscription']),
        ]);
    }

    /**
     * Update an order. Customers may update delivery fields; admins may also update status.
     *
     * @param  Request  $request
     * @param  Order    $order
     * @return JsonResponse
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        if ($request->user()->id !== $order->user_id && !$request->user()->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $rules = [
            'delivery_address' => 'sometimes|nullable|string|max:500',
            'delivery_date'    => 'sometimes|nullable|date',
        ];

        if ($request->user()->isAdmin()) {
            $rules['status'] = 'sometimes|required|in:pending,in_production,ready,out_for_delivery,delivered,cancelled';
        }

        $validated = $request->validate($rules);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully',
            'data'    => $order->load(['user', 'pet', 'items.recipe']),
        ]);
    }
}
