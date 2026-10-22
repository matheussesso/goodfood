import { describe, expect, it } from "vitest";
import type { Recipe } from "@/hooks/useRecipes";
import {
  MAX_PLAN_DAYS,
  MIN_PLAN_DAYS,
  addStep,
  buildTimeline,
  clampDuration,
  minimumDurationDays,
  moveStep,
  removeStep,
  setStepDuration,
  stepsForPet,
  toOrderItems,
  totalDays,
  type MealPlanStep,
} from "./meal-plan";

/** Recipe feeding `dailyKg` kg per day. */
const recipe = (id: number, dailyKg = 0.5, duration_days?: number) =>
  ({ id, name: `R${id}`, duration_days, ingredients: [{ id: 1, pivot: { quantity: String(dailyKg), unit: "kg" } }] }) as unknown as Recipe;

const step = (key: string, petId: number, durationDays = 15): MealPlanStep => ({ key, petId, recipeId: 1, durationDays });

describe("minimumDurationDays", () => {
  it("is the plan minimum when the recipe is heavy enough", () => {
    expect(minimumDurationDays(recipe(1, 0.5))).toBe(MIN_PLAN_DAYS);
  });

  it("grows until the recipe reaches 1.5 kg", () => {
    expect(minimumDurationDays(recipe(1, 0.1))).toBe(15);
    expect(minimumDurationDays(recipe(1, 0.07))).toBe(22);
  });

  it("falls back to the plan minimum without ingredients", () => {
    expect(minimumDurationDays({ ingredients: [] } as unknown as Recipe)).toBe(MIN_PLAN_DAYS);
  });
});

describe("clampDuration", () => {
  it("keeps whole days inside the allowed range", () => {
    expect(clampDuration(3)).toBe(MIN_PLAN_DAYS);
    expect(clampDuration(120)).toBe(MAX_PLAN_DAYS);
    expect(clampDuration(10.6)).toBe(11);
    expect(clampDuration(10, 15)).toBe(15);
    expect(clampDuration(Number.NaN, 9)).toBe(9);
  });
});

describe("plan editing", () => {
  it("adds a recipe with its own duration, raised to its minimum", () => {
    const plan = addStep(addStep([], 1, recipe(1, 0.5, 30)), 1, recipe(2, 0.1, 7));
    expect(plan.map((s) => [s.recipeId, s.durationDays])).toEqual([[1, 30], [2, 15]]);
    expect(new Set(plan.map((s) => s.key)).size).toBe(2);
  });

  it("allows the same recipe more than once and removes by key", () => {
    const plan = addStep(addStep([], 1, recipe(1)), 1, recipe(1));
    expect(plan).toHaveLength(2);
    expect(removeStep(plan, plan[0].key)).toEqual([plan[1]]);
  });

  it("changes a duration within the bounds", () => {
    const plan = [step("a", 1), step("b", 1)];
    expect(setStepDuration(plan, "b", 200)[1].durationDays).toBe(MAX_PLAN_DAYS);
    expect(setStepDuration(plan, "a", 8, 12)[0].durationDays).toBe(12);
  });

  it("moves a step among its own pet's steps only", () => {
    const plan = [step("a", 1), step("x", 2), step("b", 1)];
    expect(moveStep(plan, "b", -1).map((s) => s.key)).toEqual(["b", "x", "a"]);
    expect(moveStep(plan, "a", -1)).toBe(plan);
    expect(moveStep(plan, "x", 1)).toBe(plan);
    expect(stepsForPet(plan, 1).map((s) => s.key)).toEqual(["a", "b"]);
  });
});

describe("timeline and payload", () => {
  it("chains the day ranges of a pet's steps", () => {
    const steps = [step("a", 1, 15), step("b", 1, 30)];
    expect(buildTimeline(steps).map(({ startDay, endDay }) => [startDay, endDay])).toEqual([[1, 15], [16, 45]]);
    expect(totalDays(steps)).toBe(45);
  });

  it("sends one item per step, in plan order", () => {
    expect(toOrderItems([step("a", 1, 15), step("b", 2, 7)])).toEqual([
      { pet_id: 1, recipe_id: 1, duration_days: 15 },
      { pet_id: 2, recipe_id: 1, duration_days: 7 },
    ]);
  });
});
