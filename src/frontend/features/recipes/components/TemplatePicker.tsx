"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, FileText, Loader2, Scale, Utensils, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/hooks/useRecipes";
import { formatBRL } from "@/lib/format";
import { formatQuantity, recipeDailyKg, weightQuantity } from "../recipe-facts";
import { CompositionBar, RecipeDetailsDisclosure, RecipeStatGrid } from "./RecipeFacts";

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
 * for the pet, in one click) or "customize" (opens the form pre-filled). Each
 * card shows what the template is made of before the customer picks it.
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
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
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

      <ul className="space-y-3">
        {templates.length === 0 && <li className="rounded-lg bg-muted/30 p-4 text-center text-sm">{t("no_templates")}</li>}
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            busy={busyId === template.id}
            locked={busyId !== null}
            onCustomize={() => onCustomize(template)}
            onUse={() => onUse(template)}
          />
        ))}
      </ul>
    </div>
  );
}

interface TemplateCardProps {
  template: Recipe;
  /** This template is being used right now. */
  busy: boolean;
  /** Some template is being used: actions are locked. */
  locked: boolean;
  onCustomize: () => void;
  onUse: () => void;
}

/**
 * One catalog template: species, description, key figures (duration,
 * portions, daily weight, estimated price), composition by category and,
 * on demand, the ingredient amounts and preparation.
 */
function TemplateCard({ template, busy, locked, onCustomize, onUse }: TemplateCardProps) {
  const t = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const tOrders = useTranslations("Orders");
  const days = template.duration_days ?? 0;
  const species = template.pet_type === "dog" ? tCat("dog") : template.pet_type === "cat" ? tCat("cat") : tCat("both");
  const price = Number(template.base_cost ?? 0);

  return (
    <li className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 break-words font-semibold text-foreground">{template.name}</h4>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{species}</span>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{template.description || t("no_description")}</p>

      <RecipeStatGrid
        stats={[
          { label: tCat("duration"), value: tOrders("days_value", { count: days }), icon: <CalendarDays className="h-3 w-3" aria-hidden="true" /> },
          { label: t("portions_per_day_caps"), value: template.daily_portions ?? "—", icon: <Utensils className="h-3 w-3" aria-hidden="true" /> },
          { label: t("daily_weight"), value: formatQuantity(weightQuantity(recipeDailyKg(template)), t("unit_each")), icon: <Scale className="h-3 w-3" aria-hidden="true" /> },
          {
            label: t("estimated_price"),
            value: price > 0 ? formatBRL(price, true) : "—",
            icon: <Wallet className="h-3 w-3" aria-hidden="true" />,
            accent: true,
          },
        ]}
      />
      {price > 0 && days > 0 && (
        <p className="-mt-1 text-xs text-muted-foreground">{t("price_per_day_hint", { price: formatBRL(price / days, true), days })}</p>
      )}

      <CompositionBar recipe={template} />
      <RecipeDetailsDisclosure recipe={template} days={days || undefined} id={`template-details-${template.id}`} withComposition={false} />

      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button type="button" variant="outline" className="min-h-11" onClick={onCustomize} disabled={locked}>
          {t("customize_template")}
        </Button>
        <Button type="button" className="min-h-11" onClick={onUse} disabled={locked}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("cloning")} /> : t("use_template_direct")}
        </Button>
      </div>
    </li>
  );
}
