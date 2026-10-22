import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import type { Recipe } from "./useRecipes";
import { useRecipeDurationCosts } from "./useRecipeDurationCost";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

const recipe = { id: 3, daily_portions: 2, ingredients: [{ id: 7, pivot: { quantity: "0.2", unit: "kg" } }] } as unknown as Recipe;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRecipeDurationCosts", () => {
  it("prices each entry for its own duration and sums the total", async () => {
    vi.mocked(apiClient.post).mockImplementation(async (_url, body) =>
      axiosResponse({ success: true, data: { estimatedCost: (body as { duration_days: number }).duration_days } })
    );

    const { result } = renderHook(
      () => useRecipeDurationCosts([
        { key: "a", recipe, durationDays: 15 },
        { key: "b", recipe, durationDays: 30 },
      ]),
      { wrapper: createWrapper(createTestQueryClient()) }
    );

    await waitFor(() => expect(result.current.total).toBe(45));
    expect(result.current.costs).toEqual({ a: 15, b: 30 });
    expect(apiClient.post).toHaveBeenCalledWith("/recipes/calculate-cost", {
      ingredients: [{ ingredient_id: 7, quantity: 0.2, unit: "kg" }],
      duration_days: 15,
      daily_portions: 2,
    });
  });

  it("skips entries without a recipe", () => {
    const { result } = renderHook(() => useRecipeDurationCosts([{ key: "a", recipe: undefined, durationDays: 15 }]), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(result.current.total).toBe(0);
  });
});
