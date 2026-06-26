<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use Illuminate\Http\Request;

class GeneralSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $settings = GeneralSetting::getInstance();
        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $settings = GeneralSetting::getInstance();
        
        $validated = $request->validate([
            'ingredient_cost_days_division' => 'nullable|numeric',
            'production_fixed_value' => 'nullable|numeric',
            'production_days_division' => 'nullable|numeric',
            'production_weight_multiplier' => 'nullable|numeric',
            'logistics_fixed_multiplier' => 'nullable|numeric',
            'reserve_margin_fixed_value' => 'nullable|numeric',
            'reserve_margin_transfer_multiplier' => 'nullable|numeric',
            'gfp_mkt_fixed_value' => 'nullable|numeric',
            'gfp_mkt_fixed_multiplier' => 'nullable|numeric',
            'fiscal_fixed_multiplier' => 'nullable|numeric',
            'charge_fixed_value' => 'nullable|numeric',
            'charge_fixed_multiplier' => 'nullable|numeric',
            'schedule_fixed_value' => 'nullable|numeric',
            'schedule_fixed_multiplier' => 'nullable|numeric',
            'difficulty_fixed_value' => 'nullable|numeric',
        ]);

        $settings->update($validated);

        return response()->json([
            'success' => true,
            'data' => $settings,
            'message' => 'Settings updated successfully.',
        ]);
    }
}
