import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useSubscription, useSubscriptions, Subscription } from "./useSubscriptions";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const subscription = { id: 3, user_id: 1, pet_id: 7, duration_days: 14 } as Subscription;

describe("useSubscription", () => {
  it("fetches a subscription and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: subscription }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useSubscription(3), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.subscription).toEqual(subscription));
    expect(apiClient.get).toHaveBeenCalledWith("/subscriptions/3");
    expect(queryClient.getQueryData(["subscription", "3"])).toEqual(subscription);
  });

  it("does not fetch when the id is falsy", () => {
    const { result } = renderHook(() => useSubscription(""), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.subscription).toBeUndefined();
  });
});

describe("useSubscriptions", () => {
  it("fetches the subscriptions list and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [subscription] }));

    const { result } = renderHook(() => useSubscriptions(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.subscriptions).toEqual([subscription]));
    expect(apiClient.get).toHaveBeenCalledWith("/subscriptions");
  });

  it("creates a subscription and invalidates the list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: subscription }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const payload = { pet_id: 7, recipe_ids: [1, 2], start_date: "2026-01-01", duration_days: 14 };

    const { result } = renderHook(() => useSubscriptions(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.subscriptions).toBeDefined());

    await act(async () => {
      await result.current.createSubscription(payload);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/subscriptions", payload);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["subscriptions"] });
  });

  it("updates a subscription and invalidates the list and the detail query", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSubscriptions(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.subscriptions).toBeDefined());

    await act(async () => {
      await result.current.updateSubscription({ id: 3, status: "paused" });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/subscriptions/3", { status: "paused" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["subscriptions"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["subscription", "3"] });
  });
});
