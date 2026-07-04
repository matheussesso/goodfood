import { z } from "zod";

/**
 * A non-negative pricing parameter. Inputs register with `valueAsNumber`,
 * so empty fields arrive as NaN and fail validation as intended.
 */
const pricingValue = z.number().min(0);

/**
 * Validation schema for the global pricing settings form (admin catalog).
 * Mirrors the backend UpdateGeneralSettingRequest rules.
 */
export const generalSettingsSchema = z.object({
  ingredient_cost_days_division: pricingValue,
  production_fixed_value: pricingValue,
  production_days_division: pricingValue,
  production_weight_multiplier: pricingValue,
  logistics_fixed_multiplier: pricingValue,
  reserve_margin_fixed_value: pricingValue,
  reserve_margin_transfer_multiplier: pricingValue,
  gfp_mkt_fixed_value: pricingValue,
  gfp_mkt_fixed_multiplier: pricingValue,
  fiscal_fixed_multiplier: pricingValue,
  charge_fixed_value: pricingValue,
  charge_fixed_multiplier: pricingValue,
  schedule_fixed_value: pricingValue,
  schedule_fixed_multiplier: pricingValue,
  difficulty_fixed_value: pricingValue,
});

/** Form values of the settings form (schema output). */
export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
