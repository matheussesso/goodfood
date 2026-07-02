import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Recipe } from "./useRecipes";

/** A recipe within a subscription's rotation, with its cycle position. */
export type SubscriptionRecipe = Recipe & { pivot?: { position: number } };

export interface Subscription {
  id: number;
  user_id: number;
  pet_id: number;
  /** Days between cycles (multiple of 7, minimum 14). */
  interval_days: number;
  status: string;
  start_date: string;
  next_delivery_date?: string;
  created_at: string;
  updated_at: string;

  /** Computed by backend via withCount('orders'). */
  orders_count?: number;
  /** Computed by backend via withMax('orders', 'created_at'). */
  orders_max_created_at?: string;
  /** Computed by Subscription::getEstimatedPriceAttribute() using the next cycle's recipe cost. */
  estimated_price?: number;

  pet?: Pet;
  /** Ordered recipe rotation — cycles alternate through these by pivot.position. */
  recipes?: SubscriptionRecipe[];
  user?: { id: number; name: string; email: string };
}

/** Payload for creating a subscription. */
export interface CreateSubscriptionPayload {
  pet_id: number;
  recipe_ids: number[];
  start_date: string;
  interval_days: number;
}

/** Payload for updating a subscription. */
export interface UpdateSubscriptionPayload {
  id: number;
  status?: string;
  recipe_ids?: number[];
  interval_days?: number;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
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
