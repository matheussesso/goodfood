import { describe, it, expect } from "vitest";
import type { Subscription, SubscriptionRecipe } from "@/hooks/useSubscriptions";
import { sortRecipesByWeek, weekProgressLabel } from "./utils";

const t = (_key: "current_week_progress", values: { current: string; total: string }) =>
  `Week ${values.current} of ${values.total}`;

const sub = (overrides: Partial<Subscription>) => ({ id: 1, ...overrides }) as Subscription;

describe("weekProgressLabel", () => {
  it("formats the 1-based current week", () => {
    expect(weekProgressLabel(sub({ current_cycle_index: 1, total_cycles: 4 }), t)).toBe("Week 2 of 4");
  });

  it("returns null before the plan starts or after it ends", () => {
    expect(weekProgressLabel(sub({ current_cycle_index: null, total_cycles: 4 }), t)).toBeNull();
    expect(weekProgressLabel(sub({ total_cycles: 4 }), t)).toBeNull();
  });

  it("returns null when the plan has no cycles", () => {
    expect(weekProgressLabel(sub({ current_cycle_index: 0, total_cycles: 0 }), t)).toBeNull();
  });
});

describe("sortRecipesByWeek", () => {
  const recipe = (id: number, position?: number) =>
    ({ id, pivot: position === undefined ? undefined : { position } }) as SubscriptionRecipe;

  it("orders by pivot position without mutating the input", () => {
    const input = [recipe(1, 2), recipe(2, 0), recipe(3, 1)];
    expect(sortRecipesByWeek(input).map((r) => r.id)).toEqual([2, 3, 1]);
    expect(input.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("handles undefined input", () => {
    expect(sortRecipesByWeek(undefined)).toEqual([]);
  });
});
