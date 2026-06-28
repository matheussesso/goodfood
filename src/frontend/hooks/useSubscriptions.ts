import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Recipe } from "./useRecipes";

export interface Subscription {
  id: number;
  user_id: number;
  pet_id: number;
  recipe_id: number;
  frequency: string;
  status: string;
  start_date: string;
  next_delivery_date?: string;
  created_at: string;
  updated_at: string;
  
  pet?: Pet;
  recipe?: Recipe;
  user?: { id: number; name: string; email: string };
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
    mutationFn: async (data: Partial<Subscription>) => {
      const response = await apiClient.post("/subscriptions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Subscription> & { id: number }) => {
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
