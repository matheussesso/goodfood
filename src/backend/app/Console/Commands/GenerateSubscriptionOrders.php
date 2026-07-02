<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\SubscriptionOrderGenerationService;
use Illuminate\Console\Command;

/**
 * Generates replenishment orders for every subscription whose next delivery is due.
 * Intended to run daily via the Laravel scheduler.
 */
class GenerateSubscriptionOrders extends Command
{
    /** @var string */
    protected $signature = 'subscriptions:generate-orders';

    /** @var string */
    protected $description = 'Generate replenishment orders for subscriptions with a due next_delivery_date';

    /**
     * Execute the console command.
     *
     * @param  SubscriptionOrderGenerationService  $service
     * @return int
     */
    public function handle(SubscriptionOrderGenerationService $service): int
    {
        $generated = $service->generateDueOrders();

        $this->info("Generated {$generated} subscription order(s).");

        return self::SUCCESS;
    }
}
