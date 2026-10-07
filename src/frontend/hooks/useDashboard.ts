import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Order } from "./useOrders";
import type { Subscription } from "./useSubscriptions";

/** Query key of the dashboard summary; invalidated whenever any mutation succeeds. */
export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

/** Where a new customer is in the "first order" journey, as decided by the backend. */
export type NextStep = "add_pet" | "create_recipe" | "link_recipe" | "place_order" | "complete";

/** Counts and flags describing the customer's onboarding progress. */
export interface DashboardProgress {
  has_address: boolean;
  pets_count: number;
  own_recipes_count: number;
  linked_recipes_count: number;
  /** Id of the user's first recipe that is not yet linked to any pet (where the "link" step should go). */
  first_unlinked_recipe_id: number | null;
  orders_count: number;
  subscriptions_count: number;
  next_step: NextStep;
}

/** Pet profile fields that may be missing. */
export type PetMissingField = "sex" | "neutered" | "breed" | "weight" | "age";

/** Things that need the customer's attention. */
export interface DashboardAlerts {
  pending_invoices: { id: number; order_id: number; amount: number | string; due_date: string | null }[];
  overdue_vaccines: { pet_id: number; pet_name: string; vaccine_name: string; next_due_date: string }[];
  incomplete_pets: { pet_id: number; pet_name: string; missing: PetMissingField[] }[];
}

/** Compact pet card data. */
export interface DashboardPet {
  id: number;
  name: string;
  type?: "dog" | "cat";
  breed?: string | null;
  photo_url?: string | null;
  recipes: { id: number; name: string }[];
}

/** One row of the recent orders list. */
export interface DashboardRecentOrder {
  id: number;
  status: string;
  total_price: number | string;
  items_count: number;
  invoice_status: string | null;
  created_at: string;
}

/** Payload of `GET /dashboard`. */
export interface DashboardData {
  progress: DashboardProgress;
  onboarding_dismissed: boolean;
  alerts: DashboardAlerts;
  current_order: Order | null;
  active_subscription: Subscription | null;
  pets: DashboardPet[];
  recent_orders: DashboardRecentOrder[];
}

/**
 * Loads the customer dashboard summary.
 *
 * @param enabled - Set to false to skip the request (e.g. for staff roles).
 * @returns The React Query result for `GET /dashboard`.
 */
export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: DashboardData }>("/dashboard");
      return response.data.data;
    },
  });
}

/**
 * Dismisses or restores the dashboard's "getting started" guide.
 *
 * @returns Mutators for each direction; the dashboard refetches afterwards.
 */
export function useOnboarding() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });

  const dismiss = useMutation({
    mutationFn: async () => (await apiClient.post("/onboarding/dismiss")).data,
    onSuccess: refresh,
  });
  const restore = useMutation({
    mutationFn: async () => (await apiClient.delete("/onboarding/dismiss")).data,
    onSuccess: refresh,
  });

  return {
    dismissGuide: dismiss.mutateAsync,
    isDismissing: dismiss.isPending,
    restoreGuide: restore.mutateAsync,
    isRestoring: restore.isPending,
  };
}
