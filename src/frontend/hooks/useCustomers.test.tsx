import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useCustomers, useCustomer, useUpdateCustomer, useCreateCustomer, Customer } from "./useCustomers";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const customer = { id: 2, name: "Ana", email: "ana@example.com", role: "customer" } as Customer;

describe("useCustomers", () => {
  it("sends no params when neither search nor role is given", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [customer] }));

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.customers).toEqual([customer]));
    expect(apiClient.get).toHaveBeenCalledWith("/customers", { params: {} });
  });

  it("sends the search term and role filter as query params", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [customer] }));

    const { result } = renderHook(() => useCustomers("ana", "vet"), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.customers).toEqual([customer]));
    expect(apiClient.get).toHaveBeenCalledWith("/customers", {
      params: { search: "ana", role: "vet" },
    });
  });

  it('omits the role param when the filter is "all"', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));

    const { result } = renderHook(() => useCustomers("bob", "all"), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    expect(apiClient.get).toHaveBeenCalledWith("/customers", { params: { search: "bob" } });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("defaults customers to an empty array while loading", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(result.current.customers).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useCustomer", () => {
  it("fetches one customer and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: customer }));

    const { result } = renderHook(() => useCustomer("2"), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.customer).toEqual(customer));
    expect(apiClient.get).toHaveBeenCalledWith("/customers/2");
  });

  it("does not fetch when the id is empty", () => {
    const { result } = renderHook(() => useCustomer(""), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.customer).toBeUndefined();
  });
});

describe("useUpdateCustomer", () => {
  it("puts the data, returns the unwrapped customer and invalidates list and detail", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true, data: customer }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateCustomer(), { wrapper: createWrapper(queryClient) });

    let updated: Customer | undefined;
    await act(async () => {
      updated = await result.current.mutateAsync({ id: 2, data: { name: "Ana B" } });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/customers/2", { name: "Ana B" });
    expect(updated).toEqual(customer);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["customers"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["customer", "2"] });
  });
});

describe("useCreateCustomer", () => {
  it("posts the payload, returns the unwrapped customer and invalidates the list", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: customer }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const payload = {
      name: "Ana",
      email: "ana@example.com",
      password: "Secret123!",
      password_confirmation: "Secret123!",
      role: "vet" as const,
    };

    const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper(queryClient) });

    let created: Customer | undefined;
    await act(async () => {
      created = await result.current.mutateAsync(payload);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/customers", payload);
    expect(created).toEqual(customer);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["customers"] });
  });

  it("does not invalidate when the request fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("422"));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateCustomer(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ name: "x", email: "x", password: "x", password_confirmation: "x" })
      ).rejects.toThrow("422");
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
