<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating global pricing/production settings
 * (admin action; route is already protected by AdminMiddleware).
 */
class UpdateGeneralSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ingredient_cost_days_division'      => ['nullable', 'numeric'],
            'production_fixed_value'             => ['nullable', 'numeric'],
            'production_days_division'           => ['nullable', 'numeric'],
            'production_weight_multiplier'       => ['nullable', 'numeric'],
            'logistics_fixed_multiplier'         => ['nullable', 'numeric'],
            'reserve_margin_fixed_value'         => ['nullable', 'numeric'],
            'reserve_margin_transfer_multiplier' => ['nullable', 'numeric'],
            'gfp_mkt_fixed_value'                => ['nullable', 'numeric'],
            'gfp_mkt_fixed_multiplier'           => ['nullable', 'numeric'],
            'fiscal_fixed_multiplier'            => ['nullable', 'numeric'],
            'charge_fixed_value'                 => ['nullable', 'numeric'],
            'charge_fixed_multiplier'            => ['nullable', 'numeric'],
            'schedule_fixed_value'               => ['nullable', 'numeric'],
            'schedule_fixed_multiplier'          => ['nullable', 'numeric'],
            'difficulty_fixed_value'             => ['nullable', 'numeric'],
        ];
    }
}
