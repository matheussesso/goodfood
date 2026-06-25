<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->user()->isAdmin()) {
            $orders = Order::with(['user', 'pet', 'recipe', 'subscription'])->get();
        } else {
            $orders = $request->user()->orders()->with(['pet', 'recipe', 'subscription'])->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Orders fetched successfully',
            'data' => $orders,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => 'nullable|exists:pets,id',
            'recipe_id' => 'required|exists:recipes,id',
            'subscription_id' => 'nullable|exists:subscriptions,id',
            'total_price' => 'required|numeric|min:0',
            'delivery_address' => 'nullable|string',
            'delivery_date' => 'nullable|date',
        ]);

        if (!empty($validated['pet_id'])) {
            $pet = $request->user()->pets()->find($validated['pet_id']);
            if (!$pet) {
                return response()->json(['message' => 'Pet not found or unauthorized'], 403);
            }
        }

        $order = $request->user()->orders()->create(array_merge($validated, [
            'status' => 'pending'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => $order->load(['pet', 'recipe']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Order $order)
    {
        if ($request->user()->id !== $order->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order fetched successfully',
            'data' => $order->load(['pet', 'recipe', 'subscription']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        if ($request->user()->id !== $order->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only admins or producers/delivery can update status, but for now we simplify
        $rules = [
            'delivery_address' => 'sometimes|nullable|string',
            'delivery_date' => 'sometimes|nullable|date',
        ];

        if ($request->user()->isAdmin()) {
            $rules['status'] = 'sometimes|required|in:pending,in_production,ready,out_for_delivery,delivered,cancelled';
        }

        $validated = $request->validate($rules);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully',
            'data' => $order->load(['pet', 'recipe']),
        ]);
    }
}
