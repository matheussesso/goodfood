import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Ingredient {
  id: number;
  name: string;
  category?: string;
  description?: string;
  unit: string;
  cost_per_unit: number;
  loss_rate: number;
  difficulty_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useIngredients() {
  const queryClient = useQueryClient();

  const { data: ingredients, isLoading, error } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await apiClient.get("/ingredients");
      return response.data.data as Ingredient[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Ingredient>) => {
      const response = await apiClient.post("/ingredients", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Ingredient> & { id: number }) => {
      const response = await apiClient.put(`/ingredients/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/ingredients/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });

  return {
    ingredients,
    isLoading,
    error,
    createIngredient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateIngredient: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteIngredient: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
