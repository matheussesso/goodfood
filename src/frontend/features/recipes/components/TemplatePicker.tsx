"use client";

import { useTranslations } from "next-intl";
import { Check, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/hooks/useRecipes";

interface TemplatePickerProps {
  templates: Recipe[];
  /** The customer's pets that the copy can be linked to. */
  pets: { id: number; name: string }[];
  selectedPetIds: number[];
  onTogglePet: (petId: number) => void;
  /** Open the editable form pre-filled from the template. */
  onCustomize: (template: Recipe) => void;
  /** Create a ready-to-use copy linked to the selected pets. */
  onUse: (template: Recipe) => void;
  /** The template currently being cloned, if any. */
  cloningId: number | null;
  error?: string | null;
}

/**
 * Catalog templates with two ways to use each: "use as is" (one click, copy
 * already linked to the chosen pets) or "customize" (opens the form).
 *
 * @param templates - Catalog templates.
 * @param pets - The customer's pets.
 * @param selectedPetIds - Pets the copy will be linked to.
 * @param onTogglePet - Toggle a pet in the selection.
 * @param onCustomize - Start from the template in the form.
 * @param onUse - Clone the template right away.
 * @param cloningId - Id of the template being cloned.
 * @param error - Message to show when cloning failed.
 */
export function TemplatePicker({ templates, pets, selectedPetIds, onTogglePet, onCustomize, onUse, cloningId, error }: TemplatePickerProps) {
  const t = useTranslations("Recipes");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
        <h3 className="text-xl font-bold">{t("use_template")}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{t("use_template_desc")}</p>

      {pets.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("link_for_pets")}</legend>
          <p className="text-xs text-muted-foreground">{t("link_for_pets_hint")}</p>
          <div className="flex flex-wrap gap-2">
            {pets.map((pet) => {
              const selected = selectedPetIds.includes(pet.id);
              return (
                <button
                  key={pet.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onTogglePet(pet.id)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  {pet.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className="text-xs text-muted-foreground">{t("template_used_hint")}</p>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {templates.length === 0 && <li className="rounded-lg bg-muted/30 p-4 text-center text-sm">{t("no_templates")}</li>}
        {templates.map((template) => (
          <li key={template.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("template_summary", { days: template.duration_days ?? 0, count: template.ingredients.length })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onCustomize(template)} disabled={cloningId !== null}>
                {t("customize_template")}
              </Button>
              <Button type="button" size="sm" onClick={() => onUse(template)} disabled={cloningId !== null}>
                {cloningId === template.id ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("cloning")} /> : t("use_template_direct")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
