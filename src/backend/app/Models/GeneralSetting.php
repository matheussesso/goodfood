<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
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
     * Get the singleton instance of general settings.
     * Always fetches fresh data from database.
     */
    public static function getInstance(): self
    {
        return self::find(1) ?? self::create(['id' => 1]);
    }
}
