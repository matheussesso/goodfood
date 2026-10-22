import { describe, it, expect } from "vitest";
import type { DashboardProgress } from "@/hooks/useDashboard";
import { countDone, getCurrentStep, getJourney, getStepHref } from "./journey";

const progress = (overrides: Partial<DashboardProgress> = {}): DashboardProgress => ({
  has_address: false,
  pets_count: 0,
  pets_with_recipe_count: 0,
  first_pet_without_recipe_id: null,
  orders_count: 0,
  next_step: "add_pet",
  ...overrides,
});

const statuses = (p: DashboardProgress) => getJourney(p).map((s) => s.status);

describe("getJourney", () => {
  it("starts a new customer on the pet step", () => {
    expect(statuses(progress())).toEqual(["current", "upcoming", "upcoming"]);
  });

  it("completes pet and recipe together, since a pet is registered with its recipe", () => {
    expect(statuses(progress({ pets_count: 1, pets_with_recipe_count: 1 }))).toEqual(["done", "done", "current"]);
  });

  it("asks for a recipe when the only pet is an older one without it", () => {
    expect(statuses(progress({ pets_count: 1, first_pet_without_recipe_id: 4 }))).toEqual(["done", "current", "upcoming"]);
  });

  it("finishes with the first order", () => {
    const done = progress({ pets_count: 1, pets_with_recipe_count: 1, orders_count: 1 });
    expect(statuses(done)).toEqual(["done", "done", "done"]);
    expect(getCurrentStep(getJourney(done))).toBeNull();
  });
});

describe("getStepHref", () => {
  it("sends the recipe step to the pet that still lacks one", () => {
    expect(getStepHref("recipe", progress({ first_pet_without_recipe_id: 12 }))).toBe("/pets/12/recipes/new");
    expect(getStepHref("recipe", progress())).toBe("/pets/new");
  });

  it("has fixed destinations for the other steps", () => {
    expect(getStepHref("pet", progress())).toBe("/pets/new");
    expect(getStepHref("order", progress())).toBe("/orders/new");
  });
});

describe("helpers", () => {
  it("counts done steps and finds the current one", () => {
    const steps = getJourney(progress({ pets_count: 1, pets_with_recipe_count: 1 }));
    expect(countDone(steps)).toBe(2);
    expect(getCurrentStep(steps)?.id).toBe("order");
  });
});
