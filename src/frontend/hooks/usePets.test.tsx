import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { usePets, usePet, Pet } from "./usePets";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const pet = { id: 7, user_id: 1, name: "Rex" } as Pet;

describe("usePets", () => {
  it("fetches the pets list and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [pet] }));

    const { result } = renderHook(() => usePets(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.pets).toEqual([pet]));
    expect(apiClient.get).toHaveBeenCalledWith("/pets");
  });

  it("creates a pet and invalidates the pets query", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: pet }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePets(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.pets).toBeDefined());

    await act(async () => {
      await result.current.createPet({ name: "Rex", type: "dog" });
    });

    expect(apiClient.post).toHaveBeenCalledWith("/pets", { name: "Rex", type: "dog" });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pets"] });
  });

  it("updates a pet by id, sending the rest as the body", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePets(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.pets).toBeDefined());

    await act(async () => {
      await result.current.updatePet({ id: 7, weight: 13 });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/pets/7", { weight: 13 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pets"] });
  });

  it("deletes a pet and invalidates the pets query", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: [] }));
    vi.mocked(apiClient.delete).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePets(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.pets).toBeDefined());

    await act(async () => {
      await result.current.deletePet(7);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/pets/7");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pets"] });
  });
});

describe("usePet", () => {
  it("fetches one pet and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: pet }));

    const { result } = renderHook(() => usePet("7"), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.pet).toEqual(pet));
    expect(apiClient.get).toHaveBeenCalledWith("/pets/7");
  });

  it("does not fetch when the id is empty", () => {
    const { result } = renderHook(() => usePet(""), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.pet).toBeUndefined();
  });
});
