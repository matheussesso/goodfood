import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

/** Authenticated user as returned by the API. */
export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin" | "producer" | "delivery";
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  whatsapp_notifications?: boolean;
  created_at?: string;
}

/**
 * Client-side session state. The credential itself is an httpOnly cookie
 * managed by the backend — this store only mirrors the authenticated user.
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True once the initial GET /me session check has completed. */
  isSessionResolved: boolean;
  /** Stores the user after a successful login/register response. */
  setAuth: (user: User) => void;
  /** Replaces the cached user (e.g. after a profile update). */
  updateUser: (user: User) => void;
  /** Ends the session on the backend and clears local state. */
  logout: () => Promise<void>;
  /** Clears local state only (used when the session is already invalid). */
  clearSession: () => void;
  /** Restores the user from the initial GET /me session check. */
  restoreSession: (user: User) => void;
  /** Marks the initial session check as finished (success or failure). */
  markSessionResolved: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isSessionResolved: false,

  setAuth: (user) => {
    set({ user, isAuthenticated: true, isSessionResolved: true });
  },

  updateUser: (user) => {
    set({ user });
  },

  logout: async () => {
    try {
      await apiClient.post("/logout");
    } catch {
      // The httpOnly cookie may already be expired; clear local state anyway.
    }
    set({ user: null, isAuthenticated: false });
  },

  clearSession: () => {
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: (user) => {
    set({ user, isAuthenticated: true, isSessionResolved: true });
  },

  markSessionResolved: () => {
    set({ isSessionResolved: true });
  },
}));
