import type { Recipe, RecipeIngredient } from "@/hooks/useRecipes";
import type { DraftIngredient } from "@/features/recipes/useRecipeCostSimulation";
import { DEFAULT_RECIPE_DURATION_DAYS, MIN_RECIPE_WEIGHT_KG, totalWeightKg } from "@/lib/recipe-weight";

/** Portions per day assumed for a new recipe. */
export const DEFAULT_DAILY_PORTIONS = 2;

/** Editable state of a recipe in the recipe form (pet creation, new/edit recipe). */
export interface RecipeDraft {
  name: string;
  description: string;
  instructions: string;
  duration_days: number;
  daily_portions: number;
  ingredients: DraftIngredient[];
}

/** Field-level problems of a draft, keyed by field. */
export interface RecipeDraftErrors {
  name?: "required";
  ingredients?: "required" | "min_weight";
  duration_days?: "invalid";
  daily_portions?: "invalid";
}

/** Recipe fields accepted by the API when creating or updating a recipe. */
export interface RecipePayload {
  name: string;
  description?: string;
  instructions?: string;
  duration_days: number;
  daily_portions: number;
  ingredients: RecipeIngredient[];
}

/**
 * An empty draft with the default duration and portions.
 *
 * @param name - Optional initial name.
 */
export function emptyRecipeDraft(name = ""): RecipeDraft {
  return {
    name,
    description: "",
    instructions: "",
    duration_days: DEFAULT_RECIPE_DURATION_DAYS,
    daily_portions: DEFAULT_DAILY_PORTIONS,
    ingredients: [],
  };
}

/**
 * Builds a draft from an existing recipe or catalog template.
 *
 * @param recipe - Recipe whose fields and ingredients seed the draft.
 * @param name - Optional name override (e.g. "Template (cópia)").
 */
export function recipeDraftFrom(recipe: Recipe, name?: string): RecipeDraft {
  return {
    name: name ?? recipe.name,
    description: recipe.description ?? "",
    instructions: recipe.instructions ?? "",
    duration_days: recipe.duration_days || DEFAULT_RECIPE_DURATION_DAYS,
    daily_portions: recipe.daily_portions || DEFAULT_DAILY_PORTIONS,
    ingredients: (recipe.ingredients ?? []).map((ingredient) => ({
      id: ingredient.id,
      quantity: Number(ingredient.pivot.quantity),
      unit: ingredient.pivot.unit || ingredient.unit,
    })),
  };
}

/** Ingredient rows that are actually filled in (id and a positive quantity). */
export function filledIngredients(draft: RecipeDraft): DraftIngredient[] {
  return draft.ingredients.filter((item) => item.id > 0 && Number(item.quantity) > 0);
}

/**
 * Validates a draft with the same rules as the API.
 *
 * @param draft - Draft to check.
 * @param enforceMinimumWeight - Customers must reach {@link MIN_RECIPE_WEIGHT_KG}; admins are exempt.
 * @returns The problems found (empty object when valid).
 */
export function validateRecipeDraft(draft: RecipeDraft, enforceMinimumWeight: boolean): RecipeDraftErrors {
  const errors: RecipeDraftErrors = {};
  const ingredients = filledIngredients(draft);

  if (!draft.name.trim()) errors.name = "required";
  if (!Number.isInteger(draft.duration_days) || draft.duration_days < 1) errors.duration_days = "invalid";
  if (!Number.isInteger(draft.daily_portions) || draft.daily_portions < 1) errors.daily_portions = "invalid";

  if (ingredients.length === 0) {
    errors.ingredients = "required";
  } else if (enforceMinimumWeight && totalWeightKg(ingredients, draft.duration_days) < MIN_RECIPE_WEIGHT_KG) {
    errors.ingredients = "min_weight";
  }

  return errors;
}

/**
 * Converts a draft into the API payload, dropping empty ingredient rows.
 *
 * @param draft - A valid draft.
 */
export function toRecipePayload(draft: RecipeDraft): RecipePayload {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    instructions: draft.instructions.trim() || undefined,
    duration_days: draft.duration_days,
    daily_portions: draft.daily_portions,
    ingredients: filledIngredients(draft).map((item) => ({ id: item.id, quantity: Number(item.quantity), unit: item.unit })),
  };
}
