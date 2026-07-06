<?php

namespace Database\Seeders;

use App\Models\GeneralSetting;
use Illuminate\Database\Seeder;

class GeneralSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        GeneralSetting::updateOrCreate(
            ['id' => 1],
            [
                'ingredient_cost_days_division' => 2,
                'production_fixed_value' => 45.00,
                'production_days_division' => 2.5,
                'production_weight_multiplier' => 9.000,
                'logistics_fixed_multiplier' => 0.450,
                'reserve_margin_fixed_value' => 3.00,
                'reserve_margin_transfer_multiplier' => 0.030,
                'gfp_mkt_fixed_value' => 5.00,
                'gfp_mkt_fixed_multiplier' => 0.500,
                'charge_fixed_value' => 10.00,
                'charge_fixed_multiplier' => 1.100,
                'fiscal_fixed_multiplier' => 0.075,
                'schedule_fixed_value' => 2.00,
                'schedule_fixed_multiplier' => 0.015,
                'difficulty_fixed_value' => 0.00,
            ]
        );
    }
}
