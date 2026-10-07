<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    /** Container key under which the per-request settings singleton is resolved. */
    public const CONTAINER_KEY = 'goodfood.general_settings';

    protected $fillable = [
        'production_fixed_value',
        'production_days_division',
        'production_weight_multiplier',
        'ingredient_cost_days_division',
        'logistics_fixed_multiplier',
        'reserve_margin_fixed_value',
        'reserve_margin_transfer_multiplier',
        'gfp_mkt_fixed_value',
        'gfp_mkt_fixed_multiplier',
        'fiscal_fixed_multiplier',
        'charge_fixed_value',
        'charge_fixed_multiplier',
        'schedule_fixed_value',
        'schedule_fixed_multiplier',
        'difficulty_fixed_value',
    ];

    /**
     * Drop the memoized instance whenever the row changes, so a settings
     * update is visible to every later calculation in the same request.
     */
    protected static function booted(): void
    {
        $forget = static fn () => app()->forgetInstance(self::CONTAINER_KEY);

        static::saved($forget);
        static::deleted($forget);
    }

    protected function casts(): array
    {
        return [
            'production_fixed_value' => 'decimal:2',
            'production_days_division' => 'decimal:2',
            'production_weight_multiplier' => 'decimal:3',
            'ingredient_cost_days_division' => 'decimal:2',
            'logistics_fixed_multiplier' => 'decimal:3',
            'reserve_margin_fixed_value' => 'decimal:2',
            'reserve_margin_transfer_multiplier' => 'decimal:3',
            'gfp_mkt_fixed_value' => 'decimal:2',
            'gfp_mkt_fixed_multiplier' => 'decimal:3',
            'fiscal_fixed_multiplier' => 'decimal:3',
            'charge_fixed_value' => 'decimal:2',
            'charge_fixed_multiplier' => 'decimal:3',
            'schedule_fixed_value' => 'decimal:2',
            'schedule_fixed_multiplier' => 'decimal:3',
            'difficulty_fixed_value' => 'decimal:2',
        ];
    }

    /**
     * Get the singleton instance of general settings, memoized per request
     * (see {@see AppServiceProvider}) because every recipe cost calculation
     * reads it.
     */
    public static function getInstance(): self
    {
        return app()->make(self::CONTAINER_KEY);
    }

    /**
     * Load the settings row, creating it on first use.
     *
     * On first-ever call there's no row yet: `create()` only returns the
     * attributes it was given (`id`), not the columns' DB-level defaults
     * (production/logistics/margin multipliers etc.), so it must be
     * `refresh()`ed to load the real persisted values — otherwise every
     * multiplier reads as null (coerced to 0) for the rest of that request.
     */
    public static function loadOrCreate(): self
    {
        // Not keyed on id = 1: `id` is not mass assignable and Postgres sequences
        // do not reset between rows, so the single row can have any id.
        return self::query()->orderBy('id')->first() ?? self::create([])->refresh();
    }
}
