import { create } from "zustand";

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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  restoreSession: (user: User, token: string) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (user) => {
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  restoreSession: (user, token) => {
    set({ user, token, isAuthenticated: true });
  }
}));
