<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * An order is now a meal plan: each item carries how many days its recipe
 * lasts (`duration_days`) and where it sits in its pet's sequence (`position`).
 *
 * Existing items are backfilled with their recipe's own duration (15 days when
 * the recipe has none) and with their insertion order inside each order/pet,
 * so historical orders read as single-step or sequential plans.
 */
return new class extends Migration
{
    /** Duration used for items whose recipe has no duration of its own. */
    private const FALLBACK_DURATION_DAYS = 15;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedSmallInteger('duration_days')->default(self::FALLBACK_DURATION_DAYS)->after('recipe_id');
            $table->unsignedSmallInteger('position')->default(1)->after('duration_days');
        });

        $recipeDurations = DB::table('recipes')->pluck('duration_days', 'id');
        $nextPosition = [];

        DB::table('order_items')->chunkById(500, function ($items) use ($recipeDurations, &$nextPosition): void {
            foreach ($items as $item) {
                $key = $item->order_id.':'.($item->pet_id ?? 'none');
                $nextPosition[$key] = ($nextPosition[$key] ?? 0) + 1;

                DB::table('order_items')->where('id', $item->id)->update([
                    'duration_days' => (int) ($recipeDurations[$item->recipe_id] ?? 0) ?: self::FALLBACK_DURATION_DAYS,
                    'position' => $nextPosition[$key],
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['duration_days', 'position']);
        });
    }
};
