import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useRecipes, useRecipe, calculateRecipeCost, Recipe } from "./useRecipes";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const recipe = { id: 4, name: "Chicken mix" } as Recipe;

describe("useRecipes", () => {
  it("fetches all recipes without a query string", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [recipe] }));

    const { result } = renderHook(() => useRecipes(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.recipes).toEqual([recipe]));
    expect(apiClient.get).toHaveBeenCalledWith("/recipes");
  });

  it("filters by pet id when provided and keys the cache by it", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [recipe] }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useRecipes("12"), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.recipes).toEqual([recipe]));
    expect(apiClient.get).toHaveBeenCalledWith("/recipes?pet_id=12");
    expect(queryClient.getQueryData(["recipes", { petId: "12" }])).toEqual([recipe]);
  });

  it("creates a recipe and invalidates the recipes queries", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: recipe }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const payload = { name: "New", ingredients: [{ id: 1, quantity: 200, unit: "g" }], pet_ids: [3] };

    const { result } = renderHook(() => useRecipes(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.recipes).toBeDefined());

    await act(async () => {
      await result.current.createRecipe(payload);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/recipes", payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["recipes"] });
  });

  it("updates a recipe by id without leaking the id into the body", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRecipes(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.recipes).toBeDefined());

    await act(async () => {
      await result.current.updateRecipe({ id: 4, name: "Renamed" });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/recipes/4", { name: "Renamed" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["recipes"] });
  });

  it("deletes a recipe and invalidates the recipes queries", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.delete).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRecipes(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.recipes).toBeDefined());

    await act(async () => {
      await result.current.deleteRecipe(4);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/recipes/4");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["recipes"] });
  });
});

describe("useRecipe", () => {
  it("fetches a single recipe and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: recipe }));

    const { result } = renderHook(() => useRecipe("4"), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.recipe).toEqual(recipe));
    expect(apiClient.get).toHaveBeenCalledWith("/recipes/4");
  });

  it("does not fetch when the id is empty", () => {
    const { result } = renderHook(() => useRecipe(""), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.recipe).toBeUndefined();
  });
});

describe("calculateRecipeCost", () => {
  it("posts the payload to /recipes/calculate-cost and returns data.data", async () => {
    const cost = {
      estimatedCost: 10,
      ingredientCost: 4,
      costPerKg: 20,
      totalWeight: 0.5,
      costBreakdown: [],
    };
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: cost }));
    const payload = { ingredients: [{ ingredient_id: 1, quantity: 100, unit: "g" }], duration_days: 7 };

    await expect(calculateRecipeCost(payload)).resolves.toEqual(cost);
    expect(apiClient.post).toHaveBeenCalledWith("/recipes/calculate-cost", payload);
  });

  it("propagates request failures", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("network"));

    await expect(calculateRecipeCost({ ingredients: [] })).rejects.toThrow("network");
  });
});
