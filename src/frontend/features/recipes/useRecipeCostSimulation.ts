import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { calculateRecipeCost, type RecipeCostBreakdownLine } from "@/hooks/useRecipes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/** One ingredient row of a recipe draft. Quantity may be a half-typed string. */
export interface DraftIngredient {
  id: number;
  quantity: string | number;
  unit: string;
}

interface SimulationInput {
  ingredients: DraftIngredient[];
  durationDays: number;
  dailyPortions: number;
  /** Set to false to pause the simulation (e.g. while a modal is closed). */
  enabled?: boolean;
  debounceMs?: number;
}

/** Live cost of a recipe draft. */
export interface CostSimulation {
  estimatedCost: number;
  costPerKg: number;
  costBreakdown: RecipeCostBreakdownLine[];
  /** True while the user is still typing or a request is in flight. */
  isCalculating: boolean;
}

/**
 * Prices a recipe draft through `/recipes/calculate-cost`, debounced so typing
 * does not fire a request per keystroke. Only rows with an id and a positive
 * quantity are priced; with none, everything is zero.
 *
 * @param input - Draft ingredients, duration and portions.
 * @returns The latest cost figures and a loading flag.
 */
export function useRecipeCostSimulation({
  ingredients,
  durationDays,
  dailyPortions,
  enabled = true,
  debounceMs = 500,
}: SimulationInput): CostSimulation {
  const payload = useMemo(
    () => ({
      ingredients: ingredients
        .filter((item) => item.id > 0 && Number(item.quantity) > 0)
        .map((item) => ({ ingredient_id: item.id, quantity: Number(item.quantity), unit: item.unit })),
      duration_days: durationDays,
      daily_portions: dailyPortions,
    }),
    [ingredients, durationDays, dailyPortions]
  );

  const payloadKey = JSON.stringify(payload);
  const debouncedKey = useDebouncedValue(payloadKey, debounceMs);
  const hasIngredients = payload.ingredients.length > 0;

  const query = useQuery({
    queryKey: ["recipe-cost-simulation", debouncedKey],
    queryFn: () => calculateRecipeCost(JSON.parse(debouncedKey) as typeof payload),
    enabled: enabled && hasIngredients && JSON.parse(debouncedKey).ingredients.length > 0,
    placeholderData: keepPreviousData,
  });

  const active = enabled && hasIngredients;

  return {
    estimatedCost: active ? (query.data?.estimatedCost ?? 0) : 0,
    costPerKg: active ? (query.data?.costPerKg ?? 0) : 0,
    costBreakdown: active ? (query.data?.costBreakdown ?? []) : [],
    isCalculating: active && (debouncedKey !== payloadKey || query.isFetching),
  };
}
