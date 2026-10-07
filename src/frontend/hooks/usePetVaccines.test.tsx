import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { usePetVaccines, PetVaccine } from "./usePetVaccines";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const vaccine = { id: 1, pet_id: 7, name: "Rabies", application_date: "2026-01-01" } as PetVaccine;

describe("usePetVaccines", () => {
  it("creates a vaccine, returns data.data and invalidates the pet detail", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: vaccine }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const payload = { name: "Rabies", application_date: "2026-01-01" };

    const { result } = renderHook(() => usePetVaccines(7), { wrapper: createWrapper(queryClient) });

    let created: PetVaccine | undefined;
    await act(async () => {
      created = await result.current.createVaccine(payload);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/pets/7/vaccines", payload);
    expect(created).toEqual(vaccine);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pet", "7"] });
  });

  it("updates a vaccine by id and invalidates the pet detail (string pet id)", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true, data: vaccine }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePetVaccines("7"), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.updateVaccine({ id: 1, name: "Rabies", application_date: "2026-02-02" });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/pets/7/vaccines/1", {
      name: "Rabies",
      application_date: "2026-02-02",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pet", "7"] });
  });

  it("deletes a vaccine and invalidates the pet detail", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePetVaccines(7), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.deleteVaccine(1);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/pets/7/vaccines/1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pet", "7"] });
  });

  it("does not invalidate when a mutation fails", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue(new Error("403"));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePetVaccines(7), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await expect(result.current.deleteVaccine(1)).rejects.toThrow("403");
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
