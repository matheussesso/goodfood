<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;

/**
 * Authorization rules for Subscription resources: admins may do anything;
 * customers may only act on their own subscriptions.
 */
class SubscriptionPolicy
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
     * Determine whether the user can view the subscription.
     *
     * @param  User          $user
     * @param  Subscription  $subscription
     * @return bool
     */
    public function view(User $user, Subscription $subscription): bool
    {
        return $user->id === $subscription->user_id;
    }

    /**
     * Determine whether the user can update the subscription.
     *
     * @param  User          $user
     * @param  Subscription  $subscription
     * @return bool
     */
    public function update(User $user, Subscription $subscription): bool
    {
        return $user->id === $subscription->user_id;
    }

    /**
     * Determine whether the user can cancel the subscription.
     *
     * @param  User          $user
     * @param  Subscription  $subscription
     * @return bool
     */
    public function delete(User $user, Subscription $subscription): bool
    {
        return $user->id === $subscription->user_id;
    }
}
