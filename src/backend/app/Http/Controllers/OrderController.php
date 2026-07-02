<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Recipe;
use Carbon\Carbon;
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
            $orders = Order::with(['user', 'pet', 'items.recipe.ingredients', 'items.pet', 'subscription', 'invoice'])->latest()->get();
        } else {
            $orders = $request->user()
                ->orders()
                ->with(['pet', 'items.recipe.ingredients', 'items.pet', 'subscription', 'invoice'])
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
     * Accepts an array of items (each with recipe_id and optional pet_id),
     * allowing the same recipe to appear multiple times for different pets.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'                => 'required|array|min:1',
            'items.*.recipe_id'    => 'required|integer|exists:recipes,id',
            'items.*.pet_id'       => 'nullable|integer|exists:pets,id',
            'delivery_address'     => 'nullable|string|max:1000',
        ]);

        $userPetIds = $request->user()->pets()->pluck('id');
        foreach ($validated['items'] as $item) {
            if (!empty($item['pet_id']) && !$userPetIds->contains($item['pet_id'])) {
                return response()->json(['success' => false, 'message' => 'Pet not found or unauthorized'], 403);
            }
        }

        $recipeIds   = collect($validated['items'])->pluck('recipe_id');
        $recipesById = Recipe::with('ingredients')->whereIn('id', $recipeIds->unique())->get()->keyBy('id');

        $total = collect($validated['items'])->sum(function (array $item) use ($recipesById): float {
            /** @var Recipe|null $recipe */
            $recipe = $recipesById->get($item['recipe_id']);
            return (float) ($recipe?->calculateTotalCost() ?? 0);
        });

        $order = $request->user()->orders()->create([
            'total_price'      => $total,
            'status'           => 'pending_payment',
            'delivery_address' => $validated['delivery_address'] ?? null,
        ]);

        Invoice::create([
            'order_id'       => $order->id,
            'user_id'        => $request->user()->id,
            'amount'         => $total,
            'status'         => 'pending',
            'due_date'       => Carbon::today()->addDays(3),
        ]);

        foreach ($validated['items'] as $item) {
            /** @var Recipe|null $recipe */
            $recipe = $recipesById->get($item['recipe_id']);
            $currentPrice = (float) ($recipe?->calculateTotalCost() ?? 0);
            OrderItem::create([
                'order_id'   => $order->id,
                'pet_id'     => $item['pet_id'] ?? null,
                'recipe_id'  => $item['recipe_id'],
                'unit_price' => $currentPrice,
                'quantity'   => 1,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data'    => $order->load(['items.recipe', 'items.pet', 'invoice']),
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
            'data'    => $order->load(['user', 'pet', 'items.recipe.ingredients', 'items.pet', 'subscription', 'invoice']),
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
            $rules['status'] = 'sometimes|required|in:pending_payment,pending,in_production,ready,out_for_delivery,delivered,cancelled';
            $rules['scheduled_reposicao_date'] = 'sometimes|nullable|date';
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
