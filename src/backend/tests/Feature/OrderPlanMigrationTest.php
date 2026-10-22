<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('existing order items get their recipe duration and a position per order and pet', function () {
    $migration = require database_path('migrations/2026_10_22_000003_add_duration_and_position_to_order_items.php');
    $migration->down();
    expect(Schema::hasColumn('order_items', 'duration_days'))->toBeFalse();

    $user = User::factory()->create();
    $rex = Pet::create(['user_id' => $user->id, 'name' => 'Rex', 'type' => 'dog']);
    $luna = Pet::create(['user_id' => $user->id, 'name' => 'Luna', 'type' => 'cat']);
    $recipe = fn (?int $days) => Recipe::create(['name' => 'R', 'pet_type' => 'dog', 'duration_days' => $days, 'daily_portions' => 1, 'is_template' => true]);
    $thirty = $recipe(30);
    $none = $recipe(null);
    $order = Order::create(['user_id' => $user->id, 'total_price' => 10, 'status' => 'pending_payment']);

    $insert = fn (?Pet $pet, Recipe $r) => DB::table('order_items')->insertGetId([
        'order_id' => $order->id, 'pet_id' => $pet?->id, 'recipe_id' => $r->id, 'unit_price' => 5, 'quantity' => 1,
    ]);
    $rexFirst = $insert($rex, $thirty);
    $lunaFirst = $insert($luna, $none);
    $rexSecond = $insert($rex, $none);

    $migration->up();

    $row = fn (int $id) => DB::table('order_items')->find($id);
    expect($row($rexFirst)->duration_days)->toBe(30)
        ->and($row($rexFirst)->position)->toBe(1)
        ->and($row($rexSecond)->duration_days)->toBe(15)
        ->and($row($rexSecond)->position)->toBe(2)
        ->and($row($lunaFirst)->position)->toBe(1);
});
