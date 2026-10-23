import type { Recipe } from "@/hooks/useRecipes";
import { dailyWeightKg } from "@/lib/recipe-weight";

/** One ingredient of a recipe with its daily amount and weight share. */
export interface IngredientFact {
  id: number;
  name: string;
  category: string | null;
  /** Amount per day, in `unit`. */
  quantity: number;
  unit: string;
  /** Weight per day, in kg (see {@link dailyWeightKg}). */
  dailyKg: number;
  /** Share of the recipe's daily weight, 0–1. */
  share: number;
}

/** Weight share of one ingredient category. */
export interface CategoryShare {
  category: string | null;
  share: number;
}

/** A quantity in a display-friendly unit. */
export interface Quantity {
  value: number;
  unit: string;
}

/**
 * Ingredients of a recipe with their daily amount and share of the daily
 * weight, heaviest first.
 *
 * @param recipe - Recipe with its ingredients (pivot quantity/unit) loaded.
 */
export function ingredientFacts(recipe: Pick<Recipe, "ingredients">): IngredientFact[] {
  const rows = (recipe.ingredients ?? []).map((ingredient) => {
    const quantity = Number(ingredient.pivot.quantity) || 0;
    const unit = ingredient.pivot.unit || ingredient.unit;
    return {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category || null,
      quantity,
      unit,
      dailyKg: dailyWeightKg([{ quantity, unit }]),
    };
  });
  const total = rows.reduce((sum, row) => sum + row.dailyKg, 0);

  return rows
    .map((row) => ({ ...row, share: total > 0 ? row.dailyKg / total : 0 }))
    .sort((a, b) => b.dailyKg - a.dailyKg || a.name.localeCompare(b.name));
}

/** Daily ingredient weight of a recipe, in kg. */
export function recipeDailyKg(recipe: Pick<Recipe, "ingredients">): number {
  return ingredientFacts(recipe).reduce((sum, fact) => sum + fact.dailyKg, 0);
}

/**
 * Daily weight share per ingredient category, largest first.
 *
 * @param recipe - Recipe with its ingredients loaded.
 */
export function categoryShares(recipe: Pick<Recipe, "ingredients">): CategoryShare[] {
  const byCategory = new Map<string | null, number>();
  for (const fact of ingredientFacts(recipe)) {
    byCategory.set(fact.category, (byCategory.get(fact.category) ?? 0) + fact.share);
  }
  return [...byCategory.entries()]
    .map(([category, share]) => ({ category, share }))
    .filter(({ share }) => share > 0)
    .sort((a, b) => b.share - a.share);
}

/**
 * Multiplies a daily amount by a number of days, switching g → kg and
 * ml → l once the total reaches 1000.
 *
 * @param quantity - Amount per day.
 * @param unit - Unit of the amount.
 * @param days - Number of days.
 */
export function scaleQuantity(quantity: number, unit: string, days: number): Quantity {
  const value = quantity * days;
  if (unit === "g" && value >= 1000) return { value: value / 1000, unit: "kg" };
  if (unit === "ml" && value >= 1000) return { value: value / 1000, unit: "l" };
  return { value, unit };
}

/** A weight in kg shown in grams below 1 kg. */
export function weightQuantity(kg: number): Quantity {
  return kg < 1 ? { value: kg * 1000, unit: "g" } : { value: kg, unit: "kg" };
}

/**
 * Formats a quantity as "250 g" / "1,5 kg" in pt-BR number style.
 *
 * @param quantity - Value and unit to format.
 * @param unitLabel - Display label for the `unit` measure (e.g. "un").
 */
export function formatQuantity({ value, unit }: Quantity, unitLabel: string): string {
  const digits = unit === "kg" || unit === "l" ? 2 : 0;
  const number = value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
  return `${number} ${unit === "unit" ? unitLabel : unit}`;
}

/** Tailwind background tone for an ingredient category (free-text from the catalog). */
export function categoryTone(category: string | null): string {
  const key = (category ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (key.startsWith("prote")) return "bg-rose-500";
  if (key.startsWith("carbo")) return "bg-amber-400";
  if (key.startsWith("veget")) return "bg-emerald-500";
  if (key.startsWith("gord")) return "bg-orange-300";
  if (key.startsWith("supl")) return "bg-sky-500";
  return "bg-slate-400";
}
