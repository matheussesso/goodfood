import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { useAuth, User } from "./useAuth";
import { useProfile } from "./useProfile";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

const user: User = { id: 1, name: "Jane", email: "jane@example.com", role: "customer" };

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.setState({ user, isAuthenticated: true, isSessionResolved: true });
});

describe("useProfile", () => {
  it("puts the profile and syncs the returned user into the auth store", async () => {
    const updated: User = { ...user, name: "Jane Doe" };
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true, data: updated }));

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.updateProfile({ name: "Jane Doe", email: "jane@example.com" });
    });

    expect(apiClient.put).toHaveBeenCalledWith("/profile", {
      name: "Jane Doe",
      email: "jane@example.com",
    });
    expect(useAuth.getState().user).toEqual(updated);
    expect(useAuth.getState().isAuthenticated).toBe(true);
  });

  it("leaves the auth store untouched when the response carries no user data", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true }));

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.updateProfile({ name: "Other", email: "jane@example.com" });
    });

    expect(useAuth.getState().user).toEqual(user);
  });

  it("does not touch the auth store when the profile update fails", async () => {
    vi.mocked(apiClient.put).mockRejectedValue(new Error("422"));

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await act(async () => {
      await expect(
        result.current.updateProfile({ name: "x", email: "bad" })
      ).rejects.toThrow("422");
    });

    expect(useAuth.getState().user).toEqual(user);
  });

  it("changes the password through /profile/password without touching the store", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(axiosResponse({ success: true, data: { id: 99 } }));
    const payload = {
      current_password: "old",
      password: "NewSecret123!",
      password_confirmation: "NewSecret123!",
    };

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.updatePassword(payload);
    });

    expect(apiClient.put).toHaveBeenCalledWith("/profile/password", payload);
    expect(useAuth.getState().user).toEqual(user);
  });
});
