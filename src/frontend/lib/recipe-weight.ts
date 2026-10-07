/** Minimum total ingredient weight (kg, across the whole duration) for a customer recipe. Mirrors the backend rule. */
export const MIN_RECIPE_WEIGHT_KG = 1.5;

/** Duration assumed while the form field is empty. */
export const DEFAULT_RECIPE_DURATION_DAYS = 15;

interface WeightedIngredient {
  quantity: number | string;
  unit: string;
}

/**
 * Daily weight of a recipe's ingredients in kg (g/ml → /1000, kg/l → 1:1,
 * unit → 0.1 kg each). Unknown units contribute nothing.
 *
 * @param ingredients - Rows with a per-day quantity and unit.
 */
export function dailyWeightKg(ingredients: WeightedIngredient[]): number {
  return ingredients.reduce((total, { quantity, unit }) => {
    const amount = Number(quantity);
    if (unit === "g" || unit === "ml") return total + amount / 1000;
    if (unit === "kg" || unit === "l") return total + amount;
    if (unit === "unit") return total + amount * 0.1;
    return total;
  }, 0);
}

/**
 * Total ingredient weight across the whole recipe duration, in kg.
 *
 * @param ingredients - Rows with a per-day quantity and unit.
 * @param durationDays - Recipe duration; falls back to the form default when falsy.
 */
export function totalWeightKg(ingredients: WeightedIngredient[], durationDays: number): number {
  return dailyWeightKg(ingredients) * (durationDays || DEFAULT_RECIPE_DURATION_DAYS);
}
