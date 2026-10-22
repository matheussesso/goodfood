import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { calculateRecipeCost, type Recipe } from "./useRecipes";

/** A recipe to price for a given number of days. */
export interface RecipeDurationEntry {
  /** Caller's id for the entry, used to read its cost back. */
  key: string;
  recipe: Recipe | undefined;
  durationDays: number;
}

/**
 * Live cost of each recipe for its own duration, priced from today's
 * ingredient costs via `POST /recipes/calculate-cost` — the same calculation
 * the backend runs when the order is placed (`Recipe::calculateTotalCost($days)`).
 *
 * Requests are cached per recipe and duration, so stepping back to a duration
 * already priced is instant; while a new duration loads, the previous price stays.
 *
 * @param entries - Recipes to price, each with its duration.
 * @returns Cost per entry key, the summed total and whether anything is still loading.
 */
export function useRecipeDurationCosts(entries: RecipeDurationEntry[]) {
  const results = useQueries({
    queries: entries.map(({ recipe, durationDays }) => ({
      queryKey: ["recipe-duration-cost", recipe?.id, durationDays],
      queryFn: () =>
        calculateRecipeCost({
          ingredients: (recipe?.ingredients ?? []).map((i) => ({
            ingredient_id: i.id,
            quantity: Number(i.pivot.quantity),
            unit: i.pivot.unit,
          })),
          duration_days: durationDays,
          daily_portions: recipe?.daily_portions ?? 1,
        }),
      enabled: !!recipe,
      staleTime: 60_000,
      placeholderData: keepPreviousData,
    })),
  });

  const costs: Record<string, number | undefined> = {};
  entries.forEach(({ key }, index) => {
    costs[key] = results[index]?.data?.estimatedCost;
  });

  return {
    costs,
    total: results.reduce((sum, result) => sum + (result.data?.estimatedCost ?? 0), 0),
    isLoading: results.some((result) => result.isFetching),
  };
}
