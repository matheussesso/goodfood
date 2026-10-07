import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useIngredients, Ingredient } from "./useIngredients";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const ingredient = { id: 1, name: "Chicken", unit: "g" } as Ingredient;

/** Renders the hook and waits for the initial list fetch to settle. */
async function renderLoaded() {
  vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [ingredient] }));
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(() => useIngredients(), { wrapper: createWrapper(queryClient) });
  await waitFor(() => expect(hook.result.current.ingredients).toEqual([ingredient]));
  return { ...hook, invalidate };
}

describe("useIngredients", () => {
  it("fetches the ingredients and unwraps response.data.data", async () => {
    await renderLoaded();

    expect(apiClient.get).toHaveBeenCalledWith("/ingredients");
  });

  it("creates an ingredient and invalidates the ingredients query", async () => {
    const { result, invalidate } = await renderLoaded();
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: ingredient }));

    await act(async () => {
      await result.current.createIngredient({ name: "Beef" });
    });

    expect(apiClient.post).toHaveBeenCalledWith("/ingredients", { name: "Beef" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ingredients"] });
  });

  it("updates an ingredient by id, sending the rest as the body", async () => {
    const { result, invalidate } = await renderLoaded();
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true }));

    await act(async () => {
      await result.current.updateIngredient({ id: 1, cost_per_unit: 9 });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/ingredients/1", { cost_per_unit: 9 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ingredients"] });
  });

  it("deletes an ingredient and invalidates the ingredients query", async () => {
    const { result, invalidate } = await renderLoaded();
    vi.mocked(apiClient.delete).mockResolvedValue(axiosResponse({ success: true }));

    await act(async () => {
      await result.current.deleteIngredient(1);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/ingredients/1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["ingredients"] });
  });
});
