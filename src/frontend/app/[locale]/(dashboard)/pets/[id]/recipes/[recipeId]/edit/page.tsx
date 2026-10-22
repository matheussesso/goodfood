"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePet } from "@/hooks/usePets";
import { useRecipe, useRecipes, type Recipe } from "@/hooks/useRecipes";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { PetRecipePageHeader } from "@/features/recipes/components/PetRecipePageHeader";
import { RecipeForm } from "@/features/recipes/components/RecipeForm";
import { recipeDraftFrom, toRecipePayload, validateRecipeDraft, type RecipeDraft, type RecipeDraftErrors } from "@/features/recipes/draft";

/**
 * Edits one of a pet's recipes, or deletes it. The last recipe of a pet and
 * recipes already used in orders cannot be deleted (the API refuses with 422).
 */
export default function EditPetRecipePage() {
  const { id, recipeId } = useParams<{ id: string; recipeId: string }>();
  const t = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const { pet } = usePet(id);
  const { recipe, isLoading } = useRecipe(recipeId);

  if (isLoading || !recipe) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label={tCommon("loading")} />
      </div>
    );
  }

  const isOnlyRecipe = (pet?.recipes?.length ?? 0) <= 1;

  return (
    <div className="space-y-6">
      <PetRecipePageHeader
        petId={id}
        title={t("edit_title", { name: recipe.name })}
        subtitle={pet ? t("recipe_of_pet", { name: pet.name }) : undefined}
        backLabel={t("back_to_pet", { name: pet?.name ?? "" })}
      />
      {/* Keyed by recipe so the draft is re-seeded when another recipe loads. */}
      <EditRecipeForm key={recipe.id} recipe={recipe} petId={id} isOnlyRecipe={isOnlyRecipe} />
    </div>
  );
}

/** Form body of the edit page; owns the draft seeded from the loaded recipe. */
function EditRecipeForm({ recipe, petId, isOnlyRecipe }: { recipe: Recipe; petId: string; isOnlyRecipe: boolean }) {
  const t = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const { updateRecipe, isUpdating, deleteRecipe, isDeleting } = useRecipes();

  const [draft, setDraft] = useState<RecipeDraft>(() => recipeDraftFrom(recipe));
  const [errors, setErrors] = useState<RecipeDraftErrors>({});
  const [error, setError] = useState<string | null>(null);
  const enforceMinimumWeight = user?.role !== "admin";
  const backToPet = () => router.push(`/pets/${petId}?tab=recipes`);

  const save = async () => {
    const found = validateRecipeDraft(draft, enforceMinimumWeight);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setError(null);
    try {
      await updateRecipe({ id: recipe.id, ...toRecipePayload(draft) });
      backToPet();
    } catch (err) {
      setError(getApiErrorMessage(err, tCommon("error")));
    }
  };

  const remove = async () => {
    if (!window.confirm(t("delete_confirm", { name: recipe.name }))) return;

    setError(null);
    try {
      await deleteRecipe(recipe.id);
      backToPet();
    } catch {
      setError(t("delete_blocked"));
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <RecipeForm value={draft} onChange={setDraft} errors={errors} enforceMinimumWeight={enforceMinimumWeight} />

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={remove}
            disabled={isOnlyRecipe || isDeleting || isUpdating}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("delete_recipe")}
          </Button>
          {isOnlyRecipe && <p className="text-xs text-muted-foreground">{t("delete_only_recipe_hint")}</p>}
        </div>
        <Button type="button" size="lg" className="gap-2" onClick={save} disabled={isUpdating || isDeleting}>
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {t("save_recipe")}
        </Button>
      </div>
    </div>
  );
}
