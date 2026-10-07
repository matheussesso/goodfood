import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useOrder, useOrders, Order } from "./useOrders";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

const order = { id: 5, user_id: 1, total_price: 100, status: "pending" } as Order;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOrder", () => {
  it("fetches the order and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: order }));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useOrder(5), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.order).toEqual(order));
    expect(apiClient.get).toHaveBeenCalledWith("/orders/5");
    expect(queryClient.getQueryData(["orders", "5"])).toEqual(order);
  });

  it("does not fetch when the id is falsy", () => {
    const { result } = renderHook(() => useOrder(""), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.order).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("updates the order and invalidates the list and detail queries", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: order }));
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true, data: order }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useOrder(5), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.order).toBeDefined());

    await act(async () => {
      await result.current.updateOrder({ status: "paid" });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/orders/5", { status: "paid" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders", "5"] });
  });
});

describe("useOrders", () => {
  it("fetches the orders list and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [order] }));

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.orders).toEqual([order]));
    expect(apiClient.get).toHaveBeenCalledWith("/orders");
  });

  it("exposes the error when the request fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.orders).toBeUndefined();
  });

  it("creates an order with the payload and invalidates the orders list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: order }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const payload = { items: [{ recipe_id: 2, pet_id: 3 }], delivery_address: "Street 1" };

    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.orders).toBeDefined());

    let response: unknown;
    await act(async () => {
      response = await result.current.createOrder(payload);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/orders", payload);
    expect(response).toEqual({ success: true, data: order });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] });
  });

  it("updates an order by id, sending the remaining fields as the body", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.orders).toBeDefined());

    await act(async () => {
      await result.current.updateOrder({ id: 9, status: "delivered" });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/orders/9", { status: "delivered" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] });
  });
});
