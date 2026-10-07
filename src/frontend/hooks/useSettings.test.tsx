import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useSettings, GeneralSettings } from "./useSettings";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const settings = { production_fixed_value: 10 } as GeneralSettings;

describe("useSettings", () => {
  it("fetches settings and unwraps response.data.data", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: settings }));

    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.settings).toEqual(settings));
    expect(apiClient.get).toHaveBeenCalledWith("/settings");
  });

  it("updates settings, returns the saved values and invalidates the settings query", async () => {
    const saved = { production_fixed_value: 25 } as GeneralSettings;
    vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: settings }));
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true, data: saved }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.settings).toBeDefined());

    let response: GeneralSettings | undefined;
    await act(async () => {
      response = await result.current.updateSettings({ production_fixed_value: 25 });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/settings", { production_fixed_value: 25 });
    expect(response).toEqual(saved);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["settings"] });
  });
});
