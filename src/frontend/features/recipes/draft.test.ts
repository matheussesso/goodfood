import { describe, it, expect } from "vitest";
import type { Recipe } from "@/hooks/useRecipes";
import { emptyRecipeDraft, recipeDraftFrom, toRecipePayload, validateRecipeDraft } from "./draft";

const withIngredients = (quantityKg: number, duration = 15) => ({
  ...emptyRecipeDraft("Frango"),
  duration_days: duration,
  ingredients: [{ id: 1, quantity: quantityKg, unit: "kg" }],
});

describe("validateRecipeDraft", () => {
  it("requires a name and at least one filled ingredient", () => {
    const errors = validateRecipeDraft({ ...emptyRecipeDraft(), ingredients: [{ id: 1, quantity: 0, unit: "kg" }] }, false);
    expect(errors).toEqual({ name: "required", ingredients: "required" });
  });

  it("enforces the minimum total weight only when asked (customers)", () => {
    // 0.05 kg/day × 15 days = 0.75 kg < 1.5 kg
    expect(validateRecipeDraft(withIngredients(0.05), true)).toEqual({ ingredients: "min_weight" });
    expect(validateRecipeDraft(withIngredients(0.05), false)).toEqual({});
    // 0.1 kg/day × 15 days = 1.5 kg exactly
    expect(validateRecipeDraft(withIngredients(0.1), true)).toEqual({});
  });

  it("rejects non-positive durations and portions", () => {
    const errors = validateRecipeDraft({ ...withIngredients(1), duration_days: 0, daily_portions: 0 }, false);
    expect(errors).toEqual({ duration_days: "invalid", daily_portions: "invalid" });
  });
});

describe("recipe drafts", () => {
  it("copies a recipe's fields and ingredient quantities", () => {
    const template = {
      id: 9,
      name: "Mix",
      description: "Bom",
      duration_days: 14,
      daily_portions: 3,
      ingredients: [{ id: 4, unit: "kg", pivot: { quantity: "0.300", unit: "g" } }],
    } as unknown as Recipe;

    expect(recipeDraftFrom(template, "Mix (cópia)")).toEqual({
      name: "Mix (cópia)",
      description: "Bom",
      instructions: "",
      duration_days: 14,
      daily_portions: 3,
      ingredients: [{ id: 4, quantity: 0.3, unit: "g" }],
    });
  });

  it("builds the API payload without empty rows or blank texts", () => {
    const payload = toRecipePayload({
      ...withIngredients(0.2),
      name: "  Frango  ",
      ingredients: [{ id: 1, quantity: "0.2", unit: "kg" }, { id: 2, quantity: 0, unit: "g" }],
    });

    expect(payload).toEqual({
      name: "Frango",
      description: undefined,
      instructions: undefined,
      duration_days: 15,
      daily_portions: 2,
      ingredients: [{ id: 1, quantity: 0.2, unit: "kg" }],
    });
  });
});
