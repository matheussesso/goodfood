import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Ingredient } from "./useIngredients";

export interface RecipeIngredient {
  id: number;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  price: number;
  weight_per_portion: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ingredients: (Ingredient & { pivot: { quantity: string } })[];
}

export function useRecipes() {
  const queryClient = useQueryClient();

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await apiClient.get("/recipes");
      return response.data.data as Recipe[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Recipe> & { ingredients?: RecipeIngredient[] }) => {
      const response = await apiClient.post("/recipes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Recipe> & { id: number; ingredients?: RecipeIngredient[] }) => {
      const response = await apiClient.put(`/recipes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/recipes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  return {
    recipes,
    isLoading,
    error,
    createRecipe: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRecipe: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteRecipe: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
