import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { CYCLE_DAYS, useRecipeCycleCost, useRecipeCycleCostTotal } from "./useRecipeCycleCost";
import type { Recipe } from "./useRecipes";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

/** Builds a minimal recipe with one ingredient and the given id / portions. */
function makeRecipe(id: number, dailyPortions?: number): Recipe {
  return {
    id,
    name: `Recipe ${id}`,
    duration_days: 30,
    daily_portions: dailyPortions,
    ingredients: [{ id: 10 + id, pivot: { quantity: "250", unit: "g" } }],
  } as unknown as Recipe;
}

/** Builds the `data.data` body of a calculate-cost response. */
function costResponse(estimatedCost: number) {
  return axiosResponse({
    success: true,
    data: { estimatedCost, ingredientCost: 0, costPerKg: 0, totalWeight: 0, costBreakdown: [] },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRecipeCycleCost", () => {
  it("prices the recipe for a 7-day cycle regardless of its own duration", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(costResponse(42));

    const { result } = renderHook(() => useRecipeCycleCost(makeRecipe(1, 2)), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data?.estimatedCost).toBe(42));
    expect(CYCLE_DAYS).toBe(7);
    expect(apiClient.post).toHaveBeenCalledWith("/recipes/calculate-cost", {
      ingredients: [{ ingredient_id: 11, quantity: 250, unit: "g" }],
      duration_days: 7,
      daily_portions: 2,
    });
  });

  it("defaults daily_portions to 1 when the recipe has none", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(costResponse(1));

    renderHook(() => useRecipeCycleCost(makeRecipe(1)), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(vi.mocked(apiClient.post).mock.calls[0][1]).toMatchObject({ daily_portions: 1 });
  });

  it("does not calculate while no recipe is selected", () => {
    const { result } = renderHook(() => useRecipeCycleCost(null), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe("useRecipeCycleCostTotal", () => {
  it("sums the estimated cost of every selected recipe and skips empty slots", async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce(costResponse(10))
      .mockResolvedValueOnce(costResponse(5.5));

    const recipes = [makeRecipe(1), undefined, makeRecipe(2), null];
    const { result } = renderHook(() => useRecipeCycleCostTotal(recipes), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.total).toBe(15.5));
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.post).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(apiClient.post).mock.calls) {
      expect(call[0]).toBe("/recipes/calculate-cost");
      expect(call[1]).toMatchObject({ duration_days: 7 });
    }
  });

  it("reports loading and a zero total while calculations are pending", () => {
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useRecipeCycleCostTotal([makeRecipe(1)]), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(result.current.total).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it("shares the cache with useRecipeCycleCost (same query key, one request)", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(costResponse(7));
    const queryClient = createTestQueryClient();
    const recipe = makeRecipe(3);

    const single = renderHook(() => useRecipeCycleCost(recipe), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(single.result.current.data?.estimatedCost).toBe(7));

    const total = renderHook(() => useRecipeCycleCostTotal([recipe]), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(total.result.current.total).toBe(7));
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });
});
