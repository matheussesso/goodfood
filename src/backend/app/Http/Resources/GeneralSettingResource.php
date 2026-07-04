<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of the global pricing settings singleton.
 *
 * @mixin \App\Models\GeneralSetting
 */
class GeneralSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                                 => $this->id,
            'ingredient_cost_days_division'      => $this->ingredient_cost_days_division,
            'production_fixed_value'             => $this->production_fixed_value,
            'production_days_division'           => $this->production_days_division,
            'production_weight_multiplier'       => $this->production_weight_multiplier,
            'logistics_fixed_multiplier'         => $this->logistics_fixed_multiplier,
            'reserve_margin_fixed_value'         => $this->reserve_margin_fixed_value,
            'reserve_margin_transfer_multiplier' => $this->reserve_margin_transfer_multiplier,
            'gfp_mkt_fixed_value'                => $this->gfp_mkt_fixed_value,
            'gfp_mkt_fixed_multiplier'           => $this->gfp_mkt_fixed_multiplier,
            'fiscal_fixed_multiplier'            => $this->fiscal_fixed_multiplier,
            'charge_fixed_value'                 => $this->charge_fixed_value,
            'charge_fixed_multiplier'            => $this->charge_fixed_multiplier,
            'schedule_fixed_value'               => $this->schedule_fixed_value,
            'schedule_fixed_multiplier'          => $this->schedule_fixed_multiplier,
            'difficulty_fixed_value'             => $this->difficulty_fixed_value,
            'created_at'                         => $this->created_at,
            'updated_at'                         => $this->updated_at,
        ];
    }
}
