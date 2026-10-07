import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { calculateRecipeCost } from "@/hooks/useRecipes";
import { createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useRecipeCostSimulation } from "./useRecipeCostSimulation";

vi.mock("@/hooks/useRecipes", () => ({ calculateRecipeCost: vi.fn() }));

const result = { estimatedCost: 42, ingredientCost: 10, costPerKg: 7, totalWeight: 6, costBreakdown: [{ name: "Frango", total_cost: 10 }] };

const render = (props: Parameters<typeof useRecipeCostSimulation>[0]) =>
  renderHook(() => useRecipeCostSimulation({ debounceMs: 0, ...props }), { wrapper: createWrapper(createTestQueryClient()) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(calculateRecipeCost).mockResolvedValue(result);
});

describe("useRecipeCostSimulation", () => {
  it("prices only rows with an id and a positive quantity", async () => {
    const { result: hook } = render({
      ingredients: [
        { id: 1, quantity: "0.3", unit: "kg" },
        { id: 2, quantity: "", unit: "kg" },
        { id: 3, quantity: 0, unit: "g" },
      ],
      durationDays: 15,
      dailyPortions: 2,
    });

    await waitFor(() => expect(hook.current.estimatedCost).toBe(42));
    expect(calculateRecipeCost).toHaveBeenCalledWith({
      ingredients: [{ ingredient_id: 1, quantity: 0.3, unit: "kg" }],
      duration_days: 15,
      daily_portions: 2,
    });
    expect(hook.current.costPerKg).toBe(7);
    expect(hook.current.costBreakdown).toHaveLength(1);
  });

  it("does not call the API and returns zeros without priced ingredients", () => {
    const { result: hook } = render({ ingredients: [{ id: 1, quantity: "", unit: "kg" }], durationDays: 15, dailyPortions: 2 });

    expect(calculateRecipeCost).not.toHaveBeenCalled();
    expect(hook.current).toEqual({ estimatedCost: 0, costPerKg: 0, costBreakdown: [], isCalculating: false });
  });

  it("stays idle when disabled", () => {
    const { result: hook } = render({ ingredients: [{ id: 1, quantity: 1, unit: "kg" }], durationDays: 15, dailyPortions: 2, enabled: false });

    expect(calculateRecipeCost).not.toHaveBeenCalled();
    expect(hook.current.estimatedCost).toBe(0);
    expect(hook.current.isCalculating).toBe(false);
  });
});
