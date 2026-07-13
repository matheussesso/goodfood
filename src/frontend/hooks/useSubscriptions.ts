import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Recipe } from "./useRecipes";

/** A recipe within a subscription's weekly plan, with its week (cycle) position. */
export type SubscriptionRecipe = Recipe & { pivot?: { position: number } };

export interface Subscription {
  id: number;
  user_id: number;
  pet_id: number;
  /** Total plan length in days (multiple of 7, minimum 14). */
  duration_days: number;
  status: string;
  start_date: string;
  created_at: string;
  updated_at: string;

  /** Computed by backend: duration_days / 7. */
  total_cycles?: number;
  /** Computed by backend: 0-indexed current week, or null if not started/already ended. */
  current_cycle_index?: number | null;
  /** Computed by Subscription::getEstimatedPriceAttribute() — total cost of every recipe in the plan. */
  estimated_price?: number;

  pet?: Pet;
  /** One recipe per 7-day block, ordered by pivot.position (the week index). */
  recipes?: SubscriptionRecipe[];
  user?: { id: number; name: string; email: string };
}

/** Payload for creating a subscription. */
export interface CreateSubscriptionPayload {
  pet_id: number;
  recipe_ids: number[];
  start_date: string;
  duration_days: number;
}

/** Payload for updating a subscription. */
export interface UpdateSubscriptionPayload {
  id: number;
  status?: string;
  recipe_ids?: number[];
  duration_days?: number;
}

/**
 * Fetches a single subscription by ID.
 *
 * @param id - The subscription ID to fetch.
 * @returns The subscription and its loading state.
 */
export function useSubscription(id: string | number) {
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ["subscription", String(id)],
    queryFn: async () => {
      const response = await apiClient.get(`/subscriptions/${id}`);
      return response.data.data as Subscription;
    },
    enabled: !!id,
  });

  return { subscription, isLoading, error };
}

export function useSubscriptions() {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const response = await apiClient.get("/subscriptions");
      return response.data.data as Subscription[];
    },
  });

  const createSubscription = useMutation({
    mutationFn: async (data: CreateSubscriptionPayload) => {
      const response = await apiClient.post("/subscriptions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...data }: UpdateSubscriptionPayload) => {
      const response = await apiClient.put(`/subscriptions/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", String(variables.id)] });
    },
  });

  return {
    subscriptions,
    isLoading,
    error,
    createSubscription: createSubscription.mutateAsync,
    isCreating: createSubscription.isPending,
    updateSubscription: updateSubscription.mutateAsync,
    isUpdating: updateSubscription.isPending,
  };
}
