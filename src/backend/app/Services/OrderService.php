<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Recipe;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Places orders. An order is a meal plan: per pet, a sequence of recipes, each
 * fed for its own number of days and priced live for that duration.
 */
class OrderService
{
    /** Days the customer has to pay the invoice of a new order. */
    private const INVOICE_DUE_DAYS = 3;

    /**
     * Create an order with its items and pending invoice in one transaction.
     *
     * Each item is priced from today's ingredient costs for its own
     * `duration_days`; items of the same pet get consecutive positions in the
     * order they were given.
     *
     * @param  array<int, array{pet_id: int, recipe_id: int, duration_days: int}>  $items
     * @return Order The new order with items, pets and invoice loaded.
     */
    public function place(User $user, array $items, ?string $deliveryAddress = null): Order
    {
        $recipes = Recipe::with('ingredients')
            ->whereIn('id', array_unique(array_column($items, 'recipe_id')))
            ->get()
            ->keyBy('id');

        $lines = [];
        $nextPosition = [];
        foreach ($items as $item) {
            $petId = (int) $item['pet_id'];
            $duration = (int) $item['duration_days'];
            $nextPosition[$petId] = ($nextPosition[$petId] ?? 0) + 1;

            $lines[] = [
                'pet_id' => $petId,
                'recipe_id' => (int) $item['recipe_id'],
                'duration_days' => $duration,
                'position' => $nextPosition[$petId],
                'unit_price' => round($recipes[$item['recipe_id']]->calculateTotalCost($duration), 2),
                'quantity' => 1,
            ];
        }

        $total = round(array_sum(array_column($lines, 'unit_price')), 2);

        return DB::transaction(function () use ($user, $lines, $total, $deliveryAddress): Order {
            $order = $user->orders()->create([
                'total_price' => $total,
                'status' => 'pending_payment',
                'delivery_address' => $deliveryAddress,
            ]);

            Invoice::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'amount' => $total,
                'status' => 'pending',
                'due_date' => Carbon::today()->addDays(self::INVOICE_DUE_DAYS),
            ]);

            foreach ($lines as $line) {
                OrderItem::create($line + ['order_id' => $order->id]);
            }

            return $order->load(['items.recipe.ingredients', 'items.pet', 'invoice']);
        });
    }
}
