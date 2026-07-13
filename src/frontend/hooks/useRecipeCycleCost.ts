import { useQuery, useQueries } from "@tanstack/react-query";
import { calculateRecipeCost, Recipe } from "./useRecipes";

/** Length in days of a single subscription cycle/week — mirrors `Subscription::CYCLE_DAYS` on the backend. */
export const CYCLE_DAYS = 7;

/** Builds the `/recipes/calculate-cost` payload for pricing a recipe as a single subscription cycle. */
function buildCyclePayload(recipe: Recipe) {
  return {
    ingredients: (recipe.ingredients ?? []).map((i) => ({
      ingredient_id: i.id,
      quantity: Number(i.pivot.quantity),
      unit: i.pivot.unit,
    })),
    duration_days: CYCLE_DAYS,
    daily_portions: recipe.daily_portions ?? 1,
  };
}

/**
 * Live-computed cost of a recipe for a single 7-day subscription cycle,
 * priced from today's ingredient costs regardless of the recipe's own
 * `duration_days` — mirrors the backend's `Recipe::calculateTotalCost(7)`.
 *
 * @param recipe - The recipe to price, or undefined/null while none is selected.
 * @returns The React Query result for the cost calculation.
 */
export function useRecipeCycleCost(recipe?: Recipe | null) {
  return useQuery({
    queryKey: ["recipe-cycle-cost", recipe?.id],
    queryFn: () => calculateRecipeCost(buildCyclePayload(recipe as Recipe)),
    enabled: !!recipe,
    staleTime: 60_000,
  });
}

/**
 * Live-computed total cost across several recipes (e.g. every week of a
 * subscription plan), each priced for a single 7-day cycle. Shares its cache
 * with {@link useRecipeCycleCost} (same query key), so a recipe already
 * priced in a picker row isn't re-fetched for the summary total.
 *
 * @param recipes - One recipe per week (or undefined/null for empty slots).
 * @returns The summed cost and whether any underlying calculation is still loading.
 */
export function useRecipeCycleCostTotal(recipes: (Recipe | undefined | null)[]) {
  const results = useQueries({
    queries: recipes.map((recipe) => ({
      queryKey: ["recipe-cycle-cost", recipe?.id],
      queryFn: () => calculateRecipeCost(buildCyclePayload(recipe as Recipe)),
      enabled: !!recipe,
      staleTime: 60_000,
    })),
  });

  const total = results.reduce((sum, r) => sum + (r.data?.estimatedCost ?? 0), 0);
  const isLoading = results.some((r) => r.isLoading);

  return { total, isLoading };
}
