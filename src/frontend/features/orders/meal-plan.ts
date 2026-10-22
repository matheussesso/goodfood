import type { OrderItemPayload } from "@/hooks/useOrders";
import type { Recipe } from "@/hooks/useRecipes";
import { MIN_RECIPE_WEIGHT_KG, dailyWeightKg } from "@/lib/recipe-weight";

/** Shortest duration, in days, of a recipe inside a meal plan. Mirrors `OrderItem::MIN_DURATION_DAYS`. */
export const MIN_PLAN_DAYS = 7;

/** Longest duration, in days, of a recipe inside a meal plan. Mirrors `OrderItem::MAX_DURATION_DAYS`. */
export const MAX_PLAN_DAYS = 90;

/** Quick-pick durations offered next to the stepper. */
export const DURATION_PRESETS = [7, 15, 30] as const;

/** Duration given to a recipe added without a usable duration of its own. */
export const DEFAULT_PLAN_DAYS = 15;

/** One step of a pet's meal plan: a recipe fed for `durationDays` days. */
export interface MealPlanStep {
  /** Stable client-side id (the same recipe can appear more than once). */
  key: string;
  petId: number;
  recipeId: number;
  durationDays: number;
}

/** A step positioned on its pet's day timeline (1-based, inclusive). */
export interface TimelineEntry {
  step: MealPlanStep;
  startDay: number;
  endDay: number;
}

let keySeed = 0;

/** Generates a unique step key. */
function nextKey(): string {
  keySeed += 1;
  return `step-${keySeed}`;
}

/**
 * Shortest duration a recipe can have in a plan: the plan minimum, raised
 * until the recipe feeds the minimum total ingredient weight. Mirrors
 * `OrderItem::minimumDurationDaysFor()` on the backend.
 *
 * @param recipe - Recipe with its ingredients (pivot quantity/unit) loaded.
 * @returns The minimum duration in days.
 */
export function minimumDurationDays(recipe: Pick<Recipe, "ingredients">): number {
  const daily = dailyWeightKg((recipe.ingredients ?? []).map((i) => ({ quantity: i.pivot.quantity, unit: i.pivot.unit })));
  if (daily <= 0) return MIN_PLAN_DAYS;
  return Math.max(MIN_PLAN_DAYS, Math.ceil(Number((MIN_RECIPE_WEIGHT_KG / daily).toFixed(6))));
}

/**
 * Keeps a duration inside `[min, MAX_PLAN_DAYS]`, rounding to whole days.
 *
 * @param days - Requested duration (NaN falls back to `min`).
 * @param min - Lower bound for this recipe (defaults to {@link MIN_PLAN_DAYS}).
 */
export function clampDuration(days: number, min: number = MIN_PLAN_DAYS): number {
  if (!Number.isFinite(days)) return min;
  return Math.min(MAX_PLAN_DAYS, Math.max(min, Math.round(days)));
}

/**
 * Appends a recipe to the end of a pet's plan. It starts with the recipe's
 * own duration (or {@link DEFAULT_PLAN_DAYS}), kept within the allowed range.
 *
 * @param plan - Current plan (every pet).
 * @param petId - Pet receiving the recipe.
 * @param recipe - Recipe to add, with its ingredients loaded.
 * @returns A new plan.
 */
export function addStep(plan: MealPlanStep[], petId: number, recipe: Recipe): MealPlanStep[] {
  const durationDays = clampDuration(recipe.duration_days || DEFAULT_PLAN_DAYS, minimumDurationDays(recipe));
  return [...plan, { key: nextKey(), petId, recipeId: recipe.id, durationDays }];
}

/** Removes a step from the plan. */
export function removeStep(plan: MealPlanStep[], key: string): MealPlanStep[] {
  return plan.filter((step) => step.key !== key);
}

/**
 * Changes how many days a step lasts.
 *
 * @param plan - Current plan.
 * @param key - Step to change.
 * @param days - New duration, clamped to `[min, MAX_PLAN_DAYS]`.
 * @param min - Minimum duration for the step's recipe.
 */
export function setStepDuration(plan: MealPlanStep[], key: string, days: number, min: number = MIN_PLAN_DAYS): MealPlanStep[] {
  return plan.map((step) => (step.key === key ? { ...step, durationDays: clampDuration(days, min) } : step));
}

/**
 * Swaps a step with its previous (-1) or next (+1) sibling of the same pet.
 * Steps of other pets keep their places; a move past either end is a no-op.
 */
export function moveStep(plan: MealPlanStep[], key: string, direction: -1 | 1): MealPlanStep[] {
  const index = plan.findIndex((step) => step.key === key);
  if (index === -1) return plan;

  const petId = plan[index].petId;
  const siblings = plan.map((step, i) => ({ step, i })).filter(({ step }) => step.petId === petId);
  const position = siblings.findIndex(({ i }) => i === index);
  const target = siblings[position + direction];
  if (!target) return plan;

  const next = [...plan];
  [next[index], next[target.i]] = [next[target.i], next[index]];
  return next;
}

/** The steps of one pet, in feeding order. */
export function stepsForPet(plan: MealPlanStep[], petId: number): MealPlanStep[] {
  return plan.filter((step) => step.petId === petId);
}

/**
 * Lays a pet's steps out on consecutive day ranges (day 1 is the first day
 * of the plan).
 *
 * @param steps - Steps of a single pet, in order.
 */
export function buildTimeline(steps: MealPlanStep[]): TimelineEntry[] {
  let day = 1;
  return steps.map((step) => {
    const entry = { step, startDay: day, endDay: day + step.durationDays - 1 };
    day += step.durationDays;
    return entry;
  });
}

/** Total number of days covered by the given steps. */
export function totalDays(steps: MealPlanStep[]): number {
  return steps.reduce((sum, step) => sum + step.durationDays, 0);
}

/**
 * Builds the `POST /orders` items: the backend numbers positions per pet in
 * the order items are sent, so each pet's steps keep their sequence.
 */
export function toOrderItems(plan: MealPlanStep[]): OrderItemPayload[] {
  return plan.map((step) => ({ pet_id: step.petId, recipe_id: step.recipeId, duration_days: step.durationDays }));
}
