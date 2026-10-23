"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChefHat, ChevronDown } from "lucide-react";
import type { Recipe } from "@/hooks/useRecipes";
import { cn } from "@/lib/utils";
import { categoryShares, categoryTone, formatQuantity, ingredientFacts, scaleQuantity } from "../recipe-facts";

type RecipeWithIngredients = Pick<Recipe, "ingredients">;

/** One labelled figure in a {@link RecipeStatGrid}. */
export interface RecipeStat {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Highlights the figure (e.g. the price). */
  accent?: boolean;
}

/**
 * Compact grid of recipe figures (duration, portions, weight, cost…): two
 * columns on phones, up to four from `sm`.
 *
 * @param stats - Figures to show, in order.
 * @param className - Extra classes for the grid.
 */
export function RecipeStatGrid({ stats, className }: { stats: RecipeStat[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {stats.map(({ label, value, icon, accent }) => (
        <div key={label} className="min-w-0 rounded-lg bg-muted/40 px-3 py-2">
          <dt className="flex items-start gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {icon}
            <span className="min-w-0 break-words">{label}</span>
          </dt>
          <dd className={cn("mt-0.5 truncate text-sm font-semibold", accent ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Stacked bar with each ingredient category's share of the daily weight, plus
 * a legend (category + percentage).
 *
 * @param recipe - Recipe with its ingredients loaded.
 * @param showLegend - Whether to list the categories under the bar.
 * @param thin - Slimmer bar for compact cards.
 */
export function CompositionBar({ recipe, showLegend = true, thin = false }: { recipe: RecipeWithIngredients; showLegend?: boolean; thin?: boolean }) {
  const t = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const shares = categoryShares(recipe);
  if (shares.length === 0) return null;

  const label = (category: string | null) => category ?? tCat("other");
  const percent = (share: number) => Math.round(share * 100);
  const summary = shares.map(({ category, share }) => `${label(category)} ${percent(share)}%`).join(", ");

  return (
    <div className="space-y-2">
      <div className={cn("flex gap-0.5 overflow-hidden rounded-full", thin ? "h-1.5" : "h-2.5")} role="img" aria-label={t("composition_by_category_aria", { summary })}>
        {shares.map(({ category, share }) => (
          <div key={category ?? "none"} className={cn("h-full", categoryTone(category))} style={{ flexGrow: share, flexBasis: 0 }} />
        ))}
      </div>
      {showLegend && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
          {shares.map(({ category, share }) => (
            <li key={category ?? "none"} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", categoryTone(category))} />
              {label(category)} <span className="font-semibold text-foreground">{percent(share)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Ingredient table: daily amount and, when `days` is given, the total for that
 * period (what goes into production). Heaviest ingredients first.
 *
 * @param recipe - Recipe with its ingredients loaded.
 * @param days - Period to total the amounts for.
 */
export function IngredientTable({ recipe, days }: { recipe: RecipeWithIngredients; days?: number }) {
  const t = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const facts = ingredientFacts(recipe);

  if (facts.length === 0) return <p className="text-sm text-muted-foreground">{t("no_ingredients_added")}</p>;

  const unitLabel = t("unit_each");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="pb-1.5 pr-2 font-semibold">{t("ingredients")}</th>
            <th scope="col" className="pb-1.5 px-2 text-right font-semibold">{t("qty_per_day")}</th>
            {days !== undefined && (
              <th scope="col" className="pb-1.5 pl-2 text-right font-semibold">{t("total_for_days", { count: days })}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {facts.map((fact) => (
            <tr key={fact.id}>
              <td className="py-1.5 pr-2">
                <span className="flex items-start gap-2">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", categoryTone(fact.category))} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block break-words text-foreground">{fact.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{fact.category ?? tCat("other")}</span>
                  </span>
                </span>
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                {formatQuantity({ value: fact.quantity, unit: fact.unit }, unitLabel)}
              </td>
              {days !== undefined && (
                <td className="whitespace-nowrap py-1.5 pl-2 text-right font-semibold tabular-nums text-foreground">
                  {formatQuantity(scaleQuantity(fact.quantity, fact.unit, days), unitLabel)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Preparation instructions in a native disclosure, so long texts stay
 * folded until asked for.
 *
 * @param instructions - The recipe's instructions (nothing renders when empty).
 */
export function RecipeInstructions({ instructions }: { instructions?: string | null }) {
  const t = useTranslations("Recipes");
  if (!instructions?.trim()) return null;

  return (
    <details className="group rounded-lg border bg-muted/20 px-3 py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <ChefHat className="h-4 w-4 text-primary" aria-hidden="true" />
        {t("preparation_instructions")}
      </summary>
      <p className="whitespace-pre-line pb-2 text-sm text-muted-foreground">{instructions}</p>
    </details>
  );
}

/**
 * Full recipe breakdown: composition by category, ingredient table (with
 * totals for `days` when given) and preparation instructions.
 *
 * @param recipe - Recipe with its ingredients loaded.
 * @param days - Period to total ingredient amounts for (e.g. an order item's duration).
 * @param withComposition - Whether to include the composition bar (off when it is already on screen).
 */
export function RecipeDetails({
  recipe,
  days,
  withComposition = true,
}: {
  recipe: RecipeWithIngredients & Pick<Recipe, "instructions">;
  days?: number;
  withComposition?: boolean;
}) {
  const t = useTranslations("Recipes");

  return (
    <div className="space-y-4">
      {withComposition && (
        <section className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("composition_by_category")}</h4>
          <CompositionBar recipe={recipe} />
        </section>
      )}
      <IngredientTable recipe={recipe} days={days} />
      <RecipeInstructions instructions={recipe.instructions} />
    </div>
  );
}

/**
 * Toggle that reveals {@link RecipeDetails} (composition, ingredient amounts
 * and preparation) under a "show details" button.
 *
 * @param recipe - Recipe with its ingredients loaded.
 * @param days - Period to total ingredient amounts for.
 * @param id - Unique id for the revealed region (aria-controls).
 * @param defaultOpen - Whether the details start open.
 * @param withComposition - Whether the revealed details repeat the composition bar.
 */
export function RecipeDetailsDisclosure({
  recipe,
  days,
  id,
  defaultOpen = false,
  withComposition = true,
}: {
  recipe: RecipeWithIngredients & Pick<Recipe, "instructions">;
  days?: number;
  id: string;
  defaultOpen?: boolean;
  withComposition?: boolean;
}) {
  const t = useTranslations("Recipes");
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
        {open ? t("hide_details") : t("show_details", { count: recipe.ingredients?.length ?? 0 })}
      </button>
      {open && (
        <div id={id} className="pt-2">
          <RecipeDetails recipe={recipe} days={days} withComposition={withComposition} />
        </div>
      )}
    </div>
  );
}
