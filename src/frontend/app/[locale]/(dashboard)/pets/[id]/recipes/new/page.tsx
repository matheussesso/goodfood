"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePet } from "@/hooks/usePets";
import { useCloneRecipe, useRecipes, type Recipe } from "@/hooks/useRecipes";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { PetRecipePageHeader } from "@/features/recipes/components/PetRecipePageHeader";
import { RecipeForm } from "@/features/recipes/components/RecipeForm";
import { RecipeStartStep } from "@/features/recipes/components/RecipeStartStep";
import {
  emptyRecipeDraft,
  recipeDraftFrom,
  toRecipePayload,
  validateRecipeDraft,
  type RecipeDraft,
  type RecipeDraftErrors,
} from "@/features/recipes/draft";

/**
 * Creates another recipe for a pet: start from scratch or from a catalog
 * template (as it is, or customized in the form). Recipes only exist inside
 * a pet, so this page always belongs to one.
 */
export default function NewPetRecipePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const { pet, isLoading } = usePet(id);
  const { createRecipe, isCreating } = useRecipes();
  const cloneRecipe = useCloneRecipe();

  const [mode, setMode] = useState<"start" | "form">("start");
  const [draft, setDraft] = useState<RecipeDraft>(() => emptyRecipeDraft());
  const [errors, setErrors] = useState<RecipeDraftErrors>({});
  const [busyTemplateId, setBusyTemplateId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backToPet = () => router.push(`/pets/${id}?tab=recipes`);
  const enforceMinimumWeight = user?.role !== "admin";

  const startFrom = (next: RecipeDraft) => {
    setDraft(next);
    setErrors({});
    setMode("form");
  };

  const useTemplate = async (template: Recipe) => {
    setError(null);
    setBusyTemplateId(template.id);
    try {
      await cloneRecipe.mutateAsync({ id: template.id, pet_id: Number(id) });
      backToPet();
    } catch (err) {
      setError(getApiErrorMessage(err, t("clone_error")));
    } finally {
      setBusyTemplateId(null);
    }
  };

  const save = async () => {
    const found = validateRecipeDraft(draft, enforceMinimumWeight);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setError(null);
    try {
      await createRecipe({ ...toRecipePayload(draft), pet_id: Number(id) });
      backToPet();
    } catch (err) {
      setError(getApiErrorMessage(err, tCommon("error")));
    }
  };

  if (isLoading || !pet) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label={tCommon("loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PetRecipePageHeader
        petId={id}
        title={t("new_for_pet_title", { name: pet.name })}
        subtitle={mode === "start" ? t("subtitle_method") : t("subtitle_builder")}
        backLabel={t("back_to_pet", { name: pet.name })}
      />

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      {mode === "start" ? (
        <RecipeStartStep
          onScratch={() => startFrom(emptyRecipeDraft())}
          onCustomize={(template) => startFrom(recipeDraftFrom(template, template.name + t("copy_suffix")))}
          onUse={useTemplate}
          busyId={busyTemplateId}
        />
      ) : (
        <>
          <RecipeForm value={draft} onChange={setDraft} errors={errors} enforceMinimumWeight={enforceMinimumWeight} />
          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setMode("start")} disabled={isCreating}>
              {t("change_start")}
            </Button>
            <Button type="button" size="lg" className="gap-2" onClick={save} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {t("save_recipe")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
