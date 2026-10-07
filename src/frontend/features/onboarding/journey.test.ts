import { describe, it, expect } from "vitest";
import type { DashboardProgress } from "@/hooks/useDashboard";
import { countDone, getCurrentStep, getJourney, getStepHref } from "./journey";

const progress = (overrides: Partial<DashboardProgress> = {}): DashboardProgress => ({
  has_address: false,
  pets_count: 0,
  own_recipes_count: 0,
  linked_recipes_count: 0,
  first_unlinked_recipe_id: null,
  orders_count: 0,
  subscriptions_count: 0,
  next_step: "add_pet",
  ...overrides,
});

const statuses = (p: DashboardProgress) => getJourney(p).map((s) => s.status);

describe("getJourney", () => {
  it("starts a new customer on the pet step", () => {
    expect(statuses(progress())).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
  });

  it("moves to the recipe step once a pet exists", () => {
    expect(statuses(progress({ pets_count: 1 }))).toEqual(["done", "current", "upcoming", "upcoming"]);
  });

  it("moves to the link step once a recipe exists", () => {
    expect(statuses(progress({ pets_count: 1, own_recipes_count: 1 }))).toEqual(["done", "done", "current", "upcoming"]);
  });

  it("moves to the order step once a recipe is linked", () => {
    expect(statuses(progress({ pets_count: 1, own_recipes_count: 1, linked_recipes_count: 1 }))).toEqual(["done", "done", "done", "current"]);
  });

  it("counts a subscription as the first purchase", () => {
    const done = progress({ pets_count: 1, own_recipes_count: 1, linked_recipes_count: 1, subscriptions_count: 1 });
    expect(statuses(done)).toEqual(["done", "done", "done", "done"]);
    expect(getCurrentStep(getJourney(done))).toBeNull();
  });

  it("only one step is ever current, the first unfinished one", () => {
    // A recipe without a pet: recipe is done but the pet step is still pending and current.
    const odd = progress({ own_recipes_count: 1 });
    expect(statuses(odd)).toEqual(["current", "done", "upcoming", "upcoming"]);
  });
});

describe("getStepHref", () => {
  it("points the link step at the recipe that needs linking", () => {
    expect(getStepHref("link", progress({ first_unlinked_recipe_id: 12 }))).toBe("/recipes/12/edit");
    expect(getStepHref("link", progress())).toBe("/recipes");
  });

  it("has fixed destinations for the other steps", () => {
    expect(getStepHref("pet", progress())).toBe("/pets/new");
    expect(getStepHref("recipe", progress())).toBe("/recipes/new");
    expect(getStepHref("order", progress())).toBe("/orders/new");
  });
});

describe("helpers", () => {
  it("counts done steps and finds the current one", () => {
    const steps = getJourney(progress({ pets_count: 1, own_recipes_count: 1 }));
    expect(countDone(steps)).toBe(2);
    expect(getCurrentStep(steps)?.id).toBe("link");
  });
});
