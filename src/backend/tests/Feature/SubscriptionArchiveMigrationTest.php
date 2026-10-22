<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('subscription tables are archived, not dropped, and the archive can be restored', function () {
    expect(Schema::hasTable('subscriptions'))->toBeFalse()
        ->and(Schema::hasTable('legacy_subscriptions'))->toBeTrue()
        ->and(Schema::hasTable('legacy_subscription_recipes'))->toBeTrue();

    $migration = require database_path('migrations/2026_10_22_000002_archive_subscriptions_tables.php');

    $migration->down();
    expect(Schema::hasTable('subscriptions'))->toBeTrue()
        ->and(Schema::hasTable('subscription_recipes'))->toBeTrue();

    $migration->up();
    expect(Schema::hasTable('legacy_subscriptions'))->toBeTrue()
        ->and(DB::table('legacy_subscriptions')->count())->toBe(0);
});
