<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

/**
 * Authorization rules for Order resources: admins may do anything;
 * customers may only act on their own orders.
 */
class OrderPolicy
{
    /**
     * Grant every ability to admins before other checks run.
     *
     * @param  User    $user
     * @param  string  $ability
     * @return bool|null
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    /**
     * Determine whether the user can view the order.
     *
     * @param  User   $user
     * @param  Order  $order
     * @return bool
     */
    public function view(User $user, Order $order): bool
    {
        return $user->id === $order->user_id;
    }

    /**
     * Determine whether the user can update the order.
     *
     * @param  User   $user
     * @param  Order  $order
     * @return bool
     */
    public function update(User $user, Order $order): bool
    {
        return $user->id === $order->user_id;
    }
}
