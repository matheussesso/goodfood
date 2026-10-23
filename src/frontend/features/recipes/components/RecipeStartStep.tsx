"use client";

import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { useRecipeTemplates, type Recipe } from "@/hooks/useRecipes";
import { TemplatePicker } from "./TemplatePicker";

interface RecipeStartStepProps {
  /** Start an empty recipe in the form. */
  onScratch: () => void;
  /** Start the form pre-filled from a template. */
  onCustomize: (template: Recipe) => void;
  /** Use a template as it is. */
  onUse: (template: Recipe) => void;
  busyId?: number | null;
  error?: string | null;
}

/**
 * First step of every recipe creation: start from scratch or from one of the
 * catalog templates (as it is, or customized).
 *
 * @param onScratch - Called for "start from scratch".
 * @param onCustomize - Called with the template to customize.
 * @param onUse - Called with the template to use as it is.
 * @param busyId - Template currently being used.
 * @param error - Error from using a template.
 */
export function RecipeStartStep({ onScratch, onCustomize, onUse, busyId = null, error }: RecipeStartStepProps) {
  const t = useTranslations("Recipes");
  const { templates, isLoading } = useRecipeTemplates();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <button
        type="button"
        onClick={onScratch}
        className="flex min-h-48 flex-col lg:sticky lg:top-6 lg:min-h-64 items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-card p-8 text-center transition-all hover:border-primary/60 hover:bg-primary/5"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plus className="h-8 w-8" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xl font-bold">{t("create_scratch")}</span>
          <span className="mt-2 block text-muted-foreground">{t("create_scratch_desc")}</span>
        </span>
      </button>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-8 lg:col-span-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : (
        <div className="lg:col-span-2">
          <TemplatePicker templates={templates ?? []} onCustomize={onCustomize} onUse={onUse} busyId={busyId} error={error} />
        </div>
      )}
    </div>
  );
}
