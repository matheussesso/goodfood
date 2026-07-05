import { describe, it, expect } from "vitest";
import { recipeFormSchema, recipeEditFormSchema } from "./recipe";
import { generalSettingsSchema } from "./settings";

const validRecipe = {
  name: "Frango com batata-doce",
  description: "Receita balanceada",
  pet_type: "dog",
  duration_days: 15,
  daily_portions: 2,
  instructions: "",
  is_template: false,
  pet_ids: [1, 2],
  ingredients: [{ id: 1, quantity: 0.3, unit: "kg" }],
};

describe("recipeFormSchema", () => {
  it("accepts a valid recipe", () => {
    expect(recipeFormSchema.safeParse(validRecipe).success).toBe(true);
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(recipeFormSchema.safeParse({ ...validRecipe, name: "  " }).success).toBe(false);
  });

  it("rejects a non-positive duration", () => {
    expect(recipeFormSchema.safeParse({ ...validRecipe, duration_days: 0 }).success).toBe(false);
  });

  it("rejects an ingredient with non-positive quantity", () => {
    const invalid = { ...validRecipe, ingredients: [{ id: 1, quantity: 0, unit: "kg" }] };
    expect(recipeFormSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("recipeEditFormSchema", () => {
  it("does not require is_template", () => {
    const withoutTemplate: Record<string, unknown> = { ...validRecipe };
    delete withoutTemplate.is_template;
    expect(recipeEditFormSchema.safeParse(withoutTemplate).success).toBe(true);
  });
});

describe("generalSettingsSchema", () => {
  const validSettings = {
    ingredient_cost_days_division: 30,
    production_fixed_value: 10,
    production_days_division: 15,
    production_weight_multiplier: 0.5,
    logistics_fixed_multiplier: 0.1,
    reserve_margin_fixed_value: 5,
    reserve_margin_transfer_multiplier: 0.05,
    gfp_mkt_fixed_value: 2,
    gfp_mkt_fixed_multiplier: 0.02,
    fiscal_fixed_multiplier: 0.08,
    charge_fixed_value: 1,
    charge_fixed_multiplier: 0.01,
    schedule_fixed_value: 3,
    schedule_fixed_multiplier: 0.03,
    difficulty_fixed_value: 4,
  };

  it("accepts valid settings", () => {
    expect(generalSettingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it("rejects negative values", () => {
    expect(
      generalSettingsSchema.safeParse({ ...validSettings, production_fixed_value: -1 }).success
    ).toBe(false);
  });

  it("rejects NaN (empty number input)", () => {
    expect(
      generalSettingsSchema.safeParse({ ...validSettings, charge_fixed_value: NaN }).success
    ).toBe(false);
  });
});
