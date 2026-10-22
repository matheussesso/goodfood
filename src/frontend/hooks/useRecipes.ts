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
  /** Pet the recipe belongs to; catalog templates have none. */
  pet_id?: number | null;
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
  pet?: { id: number; name: string; type?: "dog" | "cat"; user_id?: number } | null;
  ingredients: (Ingredient & { pivot: { quantity: string; unit: string } })[];
}

/**
 * Fields accepted when creating a recipe. Customer recipes need the `pet_id`
 * they belong to; only admin catalog templates (`is_template`) go without one.
 */
export type CreateRecipeInput = Omit<Partial<Recipe>, "ingredients" | "pet" | "pet_id"> & { pet_id?: number; ingredients?: RecipeIngredient[] };

/** Fields accepted when updating a recipe (a recipe never changes pet). */
export type UpdateRecipeInput = Omit<Partial<Recipe>, "ingredients" | "pet" | "pet_id"> & { id: number; ingredients?: RecipeIngredient[] };

/**
 * Recipes visible to the user (templates + recipes of their pets) or, with
 * `petId`, only that pet's recipes; plus create/update/delete mutations.
 *
 * @param petId - Optional pet to scope the list to.
 */
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
    mutationFn: async (data: CreateRecipeInput) => {
      const response = await apiClient.post<{ success: boolean; data: Recipe }>("/recipes", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateRecipeInput) => {
      const response = await apiClient.put<{ success: boolean; data: Recipe }>(`/recipes/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/recipes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["pet"] });
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

/**
 * Active catalog templates (recipes prepared by the admin to start from).
 *
 * @returns The templates and a loading flag.
 */
export function useRecipeTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["recipes", { templates: true }],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Recipe[] }>("/recipes?templates=1");
      return response.data.data;
    },
  });

  return { templates, isLoading };
}

/**
 * One recipe with its ingredients and pet.
 *
 * @param id - Recipe id (the query is skipped while empty).
 */
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

/** Payload for copying a recipe (usually a catalog template) into a pet. */
export interface CloneRecipePayload {
  id: number;
  /** Pet (own) that receives the copy. */
  pet_id: number;
  /** Optional name for the copy; defaults to the original's. */
  name?: string;
}

/**
 * Copies a recipe into one of the user's pets as a private recipe.
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
      queryClient.invalidateQueries({ queryKey: ["pet"] });
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
