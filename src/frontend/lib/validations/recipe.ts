import { z } from "zod";

/**
 * One ingredient row inside the recipe builder form. Quantity arrives as a
 * number because the inputs register with `valueAsNumber`/`setValue`.
 */
export const recipeIngredientSchema = z.object({
  id: z.number().int().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

/**
 * Validation schema for the recipe builder form (create page).
 * Mirrors the backend StoreRecipeRequest rules that apply to the UI.
 */
export const recipeFormSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pet_type: z.string(),
  duration_days: z.number().int().min(1),
  daily_portions: z.number().int().min(1),
  instructions: z.string().optional(),
  is_template: z.boolean(),
  pet_ids: z.array(z.number()),
  ingredients: z.array(recipeIngredientSchema),
});

/**
 * Validation schema for the recipe edit form — same as the builder minus
 * `is_template` (customers can never change template status).
 */
export const recipeEditFormSchema = recipeFormSchema.omit({ is_template: true });

/** Form values of the recipe create form. */
export type RecipeFormData = z.infer<typeof recipeFormSchema>;

/** Form values of the recipe edit form. */
export type RecipeEditFormData = z.infer<typeof recipeEditFormSchema>;
