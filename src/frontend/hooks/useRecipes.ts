import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Ingredient } from "./useIngredients";

export interface RecipeIngredient {
  id: number;
  quantity: number;
  unit?: string;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string;
  pet_id?: number;
  pet_type?: string;
  duration_days?: number;
  daily_portions?: number;
  instructions?: string;
  is_template: boolean;
  frequency?: string;
  base_cost: number;
  ingredient_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pets?: { id: number; name: string; photo_url?: string }[];
  ingredients: (Ingredient & { pivot: { quantity: string; unit: string } })[];
}

export function useRecipes(petId?: string) {
  const queryClient = useQueryClient();

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ["recipes", { petId }],
    queryFn: async () => {
      const url = petId ? `/recipes?pet_id=${petId}` : "/recipes";
      const response = await apiClient.get(url);
      return response.data.data as Recipe[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Partial<Recipe>, 'ingredients'|'pets'> & { ingredients?: RecipeIngredient[], pet_ids?: number[] }) => {
      const response = await apiClient.post("/recipes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Omit<Partial<Recipe>, 'ingredients'|'pets'> & { id: number; ingredients?: RecipeIngredient[], pet_ids?: number[] }) => {
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

export function useRecipe(id: string) {
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Recipe }>(`/recipes/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  return {
    recipe,
    isLoading,
    error,
  };
}

/** Payload for cloning a recipe (usually a catalog template). */
export interface CloneRecipePayload {
  id: number;
  /** Optional name for the copy; defaults to the original's. */
  name?: string;
  /** Pets (own) to link the copy to. */
  pet_ids?: number[];
}

/**
 * Copies a recipe into the user's own private recipes, optionally linking the
 * copy to their pets in the same request.
 *
 * @returns A mutation resolving to the newly created recipe.
 */
export function useCloneRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: CloneRecipePayload) => {
      const response = await apiClient.post<{ success: boolean; data: Recipe }>(`/recipes/${id}/clone`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
}

/** One line of the cost breakdown returned by /recipes/calculate-cost. */
export interface RecipeCostBreakdownLine {
  name: string;
  total_cost: number | string;
  is_supplement?: boolean;
}

/** Result of a live recipe cost calculation, priced from today's ingredient costs. */
export interface RecipeCostResult {
  estimatedCost: number;
  ingredientCost: number;
  costPerKg: number;
  totalWeight: number;
  costBreakdown: RecipeCostBreakdownLine[];
}

export async function calculateRecipeCost(data: {
  ingredients: { ingredient_id: number; quantity: number; unit?: string }[];
  duration_days?: number;
  daily_portions?: number;
}): Promise<RecipeCostResult> {
  const response = await apiClient.post("/recipes/calculate-cost", data);
  return response.data.data;
}
