<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * The subscriptions module was removed: the system works only with orders.
 *
 * The tables are renamed instead of dropped so existing plans are kept for
 * reference (no data loss); nothing in the application reads them anymore.
 * A later migration can drop the `legacy_*` tables once they are not needed.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('subscription_recipes')) {
            Schema::rename('subscription_recipes', 'legacy_subscription_recipes');
        }

        if (Schema::hasTable('subscriptions')) {
            Schema::rename('subscriptions', 'legacy_subscriptions');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('legacy_subscriptions')) {
            Schema::rename('legacy_subscriptions', 'subscriptions');
        }

        if (Schema::hasTable('legacy_subscription_recipes')) {
            Schema::rename('legacy_subscription_recipes', 'subscription_recipes');
        }
    }
};
