"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/hooks/useRecipes";
import type { NewPetRecipe } from "@/hooks/usePets";
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

interface NewPetRecipeStepProps {
  petName: string;
  /** Customers must reach the minimum total recipe weight; admins are exempt. */
  enforceMinimumWeight: boolean;
  /** Creates the pet with the chosen recipe. Rejects on API errors. */
  onSubmit: (recipe: NewPetRecipe) => Promise<void>;
  /** Back to the pet details step. */
  onBack: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

/**
 * Second step of the pet registration: the pet's first (mandatory) recipe,
 * either a catalog template used as it is or a recipe built in the form.
 *
 * @param petName - Name typed in the first step, used in the copy.
 * @param enforceMinimumWeight - Whether the minimum total weight applies.
 * @param onSubmit - Saves pet + recipe.
 * @param onBack - Returns to the pet details.
 * @param isSubmitting - Whether the save is in flight.
 * @param submitError - Error of the last save attempt.
 */
export function NewPetRecipeStep({ petName, enforceMinimumWeight, onSubmit, onBack, isSubmitting, submitError }: NewPetRecipeStepProps) {
  const t = useTranslations("Pets");
  const tRec = useTranslations("Recipes");
  const [mode, setMode] = useState<"start" | "form">("start");
  const [draft, setDraft] = useState<RecipeDraft>(() => emptyRecipeDraft());
  const [errors, setErrors] = useState<RecipeDraftErrors>({});
  const [busyTemplateId, setBusyTemplateId] = useState<number | null>(null);

  const startFrom = (next: RecipeDraft) => {
    setDraft(next);
    setErrors({});
    setMode("form");
  };

  const useTemplate = async (template: Recipe) => {
    setBusyTemplateId(template.id);
    try {
      await onSubmit({ template_id: template.id });
    } finally {
      setBusyTemplateId(null);
    }
  };

  const save = async () => {
    const found = validateRecipeDraft(draft, enforceMinimumWeight);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await onSubmit(toRecipePayload(draft));
  };

  return (
    <section aria-labelledby="pet-recipe-step" className="space-y-5">
      <div>
        <h2 id="pet-recipe-step" className="text-xl font-bold text-foreground">
          {t("recipe_step_title", { name: petName })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("recipe_step_desc")}</p>
      </div>

      {submitError && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {submitError}
        </p>
      )}

      {mode === "start" ? (
        <RecipeStartStep
          onScratch={() => startFrom(emptyRecipeDraft())}
          onCustomize={(template) => startFrom(recipeDraftFrom(template, template.name + tRec("copy_suffix")))}
          onUse={useTemplate}
          busyId={busyTemplateId}
        />
      ) : (
        <RecipeForm value={draft} onChange={setDraft} errors={errors} enforceMinimumWeight={enforceMinimumWeight} />
      )}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="gap-2" onClick={mode === "form" ? () => setMode("start") : onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {mode === "form" ? t("change_recipe_start") : t("back_to_pet_data")}
        </Button>
        {mode === "form" && (
          <Button type="button" size="lg" className="gap-2" onClick={save} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {t("create_pet_with_recipe")}
          </Button>
        )}
      </div>
    </section>
  );
}
