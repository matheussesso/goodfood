<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GeneralSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\GeneralSetting::create([
            'ingredient_cost_days_division' => 30,
            'production_fixed_value' => 15.00,
            'production_days_division' => 30,
            'production_weight_multiplier' => 2.000,
            'logistics_fixed_multiplier' => 1.100,
            'reserve_margin_fixed_value' => 5.00,
            'reserve_margin_transfer_multiplier' => 1.050,
            'gfp_mkt_fixed_value' => 0.00,
            'gfp_mkt_fixed_multiplier' => 1.080,
            'fiscal_fixed_multiplier' => 1.060,
            'charge_fixed_value' => 0.00,
            'charge_fixed_multiplier' => 1.200,
            'schedule_fixed_value' => 0.00,
            'schedule_fixed_multiplier' => 1.050,
            'difficulty_fixed_value' => 0.00,
        ]);
    }
}
