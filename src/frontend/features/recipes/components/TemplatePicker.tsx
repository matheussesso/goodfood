"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronDown, FileText, Loader2, Scale, Search, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Recipe } from "@/hooks/useRecipes";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatQuantity, recipeDailyKg, weightQuantity } from "../recipe-facts";
import { CompositionBar, RecipeDetails } from "./RecipeFacts";

/** From this many templates on, the list gets a search field. */
const SEARCH_THRESHOLD = 4;

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
 * Cards are compact and the list scrolls, with a name search once the
 * catalog grows; each card can expand to the full composition.
 *
 * @param templates - Catalog templates.
 * @param onCustomize - Start from the template in the form.
 * @param onUse - Use the template as it is.
 * @param busyId - Id of the template being used.
 * @param error - Message to show when using a template failed.
 */
export function TemplatePicker({ templates, onCustomize, onUse, busyId, error }: TemplatePickerProps) {
  const t = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? templates.filter((template) => template.name.toLowerCase().includes(query)) : templates;
  }, [templates, search]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
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

      {templates.length >= SEARCH_THRESHOLD && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tCat("search_template")}
            aria-label={tCat("search_template")}
            className="h-11 pl-9"
          />
        </div>
      )}

      <ul className="-mr-1 max-h-[28rem] space-y-2 overflow-y-auto overscroll-contain pr-1 lg:max-h-[min(36rem,65vh)]">
        {templates.length === 0 && <li className="rounded-lg bg-muted/30 p-4 text-center text-sm">{t("no_templates")}</li>}
        {templates.length > 0 && visible.length === 0 && (
          <li className="rounded-lg bg-muted/30 p-4 text-center text-sm">{t("no_templates_match")}</li>
        )}
        {visible.map((template) => (
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
 * One catalog template in a compact card: name, species and price, a line of
 * key figures (duration, portions, daily weight), the description and a
 * composition bar; the composition legend, ingredient amounts and
 * preparation open on demand.
 */
function TemplateCard({ template, busy, locked, onCustomize, onUse }: TemplateCardProps) {
  const t = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const tOrders = useTranslations("Orders");
  const [open, setOpen] = useState(false);

  const days = template.duration_days ?? 0;
  const species = template.pet_type === "dog" ? tCat("dog") : template.pet_type === "cat" ? tCat("cat") : tCat("both");
  const price = Number(template.base_cost ?? 0);
  const detailsId = `template-details-${template.id}`;

  return (
    <li className="space-y-2 rounded-xl border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold leading-snug text-foreground">
            <span className="min-w-0 break-words">{template.name}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{species}</span>
          </h4>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{template.description || t("no_description")}</p>
        </div>
        {price > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatBRL(price, true)}</p>
            {days > 0 && <p className="text-[11px] text-muted-foreground">{t("price_per_day_short", { price: formatBRL(price / days, true) })}</p>}
          </div>
        )}
      </div>

      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label={t("template_figures")}>
        <li className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {tOrders("days_value", { count: days })}
        </li>
        {template.daily_portions ? (
          <li className="flex items-center gap-1">
            <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
            {t("portions_per_day_value", { count: template.daily_portions })}
          </li>
        ) : null}
        <li className="flex items-center gap-1">
          <Scale className="h-3.5 w-3.5" aria-hidden="true" />
          {t("weight_per_day_value", { weight: formatQuantity(weightQuantity(recipeDailyKg(template)), t("unit_each")) })}
        </li>
      </ul>

      <CompositionBar recipe={template} showLegend={open} thin />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          {open ? t("hide_details") : t("show_details", { count: template.ingredients.length })}
        </button>
        <div className="flex flex-1 justify-end gap-2 sm:flex-none">
          <Button type="button" variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={onCustomize} disabled={locked}>
            {t("customize_template")}
          </Button>
          <Button type="button" className="min-h-11 flex-1 sm:flex-none" onClick={onUse} disabled={locked}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("cloning")} /> : t("use_template_direct")}
          </Button>
        </div>
      </div>

      {open && (
        <div id={detailsId} className="border-t pt-3">
          <RecipeDetails recipe={template} days={days || undefined} withComposition={false} />
        </div>
      )}
    </li>
  );
}
