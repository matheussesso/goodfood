import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

import { useAuth, User } from "./useAuth";
import { apiClient } from "@/lib/api-client";

const user: User = {
  id: 1,
  name: "Jane",
  email: "jane@example.com",
  role: "customer",
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.setState({ user: null, isAuthenticated: false, isSessionResolved: false });
});

describe("useAuth store", () => {
  it("setAuth stores the user and marks the session as resolved", () => {
    useAuth.getState().setAuth(user);

    const state = useAuth.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isSessionResolved).toBe(true);
  });

  it("restoreSession behaves like a successful GET /me check", () => {
    useAuth.getState().restoreSession(user);

    const state = useAuth.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isSessionResolved).toBe(true);
  });

  it("markSessionResolved resolves without authenticating", () => {
    useAuth.getState().markSessionResolved();

    const state = useAuth.getState();
    expect(state.isSessionResolved).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it("logout calls the API and clears local state", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });
    useAuth.getState().setAuth(user);

    await useAuth.getState().logout();

    expect(apiClient.post).toHaveBeenCalledWith("/logout");
    expect(useAuth.getState().user).toBeNull();
    expect(useAuth.getState().isAuthenticated).toBe(false);
  });

  it("logout clears local state even when the API call fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("session expired"));
    useAuth.getState().setAuth(user);

    await useAuth.getState().logout();

    expect(useAuth.getState().isAuthenticated).toBe(false);
  });

  it("updateUser replaces the cached user without touching auth flags", () => {
    useAuth.getState().setAuth(user);
    useAuth.getState().updateUser({ ...user, name: "Jane Doe" });

    expect(useAuth.getState().user?.name).toBe("Jane Doe");
    expect(useAuth.getState().isAuthenticated).toBe(true);
  });
});
