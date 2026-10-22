"use client";

import { useTranslations } from "next-intl";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/hooks/useRecipes";

interface TemplatePickerProps {
  templates: Recipe[];
  /** Open the editable form pre-filled from the template. */
  onCustomize: (template: Recipe) => void;
  /** Use the template as it is (a private copy for the pet). */
  onUse: (template: Recipe) => void;
  /** The template currently being used, if any (shows a spinner and locks the buttons). */
  busyId: number | null;
  error?: string | null;
}

/**
 * Catalog templates with two ways to use each: "use as it is" (a private copy
 * for the pet, in one click) or "customize" (opens the form pre-filled).
 *
 * @param templates - Catalog templates.
 * @param onCustomize - Start from the template in the form.
 * @param onUse - Use the template as it is.
 * @param busyId - Id of the template being used.
 * @param error - Message to show when using a template failed.
 */
export function TemplatePicker({ templates, onCustomize, onUse, busyId, error }: TemplatePickerProps) {
  const t = useTranslations("Recipes");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
        <h3 className="text-xl font-bold">{t("use_template")}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{t("use_template_desc")}</p>
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
              <Button type="button" size="sm" variant="outline" onClick={() => onCustomize(template)} disabled={busyId !== null}>
                {t("customize_template")}
              </Button>
              <Button type="button" size="sm" onClick={() => onUse(template)} disabled={busyId !== null}>
                {busyId === template.id ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("cloning")} /> : t("use_template_direct")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
