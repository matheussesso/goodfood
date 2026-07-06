<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Subscription;
use Carbon\Carbon;

/**
 * Generates replenishment orders for subscriptions whose next delivery is due,
 * cycling through each subscription's recipe rotation and advancing its schedule.
 */
class SubscriptionOrderGenerationService
{
    /**
     * Generate an order for every active subscription whose next_delivery_date has arrived.
     *
     * @return int The number of orders generated.
     */
    public function generateDueOrders(): int
    {
        $dueSubscriptions = Subscription::query()
            ->where('status', 'active')
            ->whereDate('next_delivery_date', '<=', Carbon::today())
            ->with(['recipes.ingredients', 'pet'])
            ->get();

        $generated = 0;
        foreach ($dueSubscriptions as $subscription) {
            if ($this->generateForSubscription($subscription) !== null) {
                $generated++;
            }
        }

        return $generated;
    }

    /**
     * Create a replenishment order for a single subscription using the recipe
     * currently due in its rotation, then advance its next_delivery_date.
     *
     * @return Order|null Null if the subscription has no recipes in its rotation.
     */
    public function generateForSubscription(Subscription $subscription): ?Order
    {
        $recipe = $subscription->recipeForCycle($subscription->currentCycleIndex());
        if (! $recipe) {
            return null;
        }

        $unitPrice = (float) $recipe->calculateTotalCost();

        $order = Order::create([
            'user_id' => $subscription->user_id,
            'subscription_id' => $subscription->id,
            'total_price' => $unitPrice,
            'status' => 'pending_payment',
            'delivery_address' => null,
        ]);

        Invoice::create([
            'order_id' => $order->id,
            'user_id' => $subscription->user_id,
            'amount' => $unitPrice,
            'status' => 'pending',
            'due_date' => Carbon::today()->addDays(3),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'pet_id' => $subscription->pet_id,
            'recipe_id' => $recipe->id,
            'unit_price' => $unitPrice,
            'quantity' => 1,
        ]);

        $subscription->next_delivery_date = $subscription->next_delivery_date
            ->copy()
            ->addDays($subscription->interval_days);
        $subscription->save();

        return $order;
    }
}
