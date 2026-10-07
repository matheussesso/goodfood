"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, DollarSign, FileText, Loader2 } from "lucide-react";
import type { RecipeCostBreakdownLine } from "@/hooks/useRecipes";
import type { Ingredient } from "@/hooks/useIngredients";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BREAKDOWN_LABEL_KEYS, CHARGE_LINE, RESULT_LINE, sortSupplementLines, sumBreakdown } from "@/features/recipes/cost";
import type { DraftIngredient } from "@/features/recipes/useRecipeCostSimulation";

interface RecipeCostBreakdownProps {
  estimatedCost: number;
  costPerKg: number;
  costBreakdown: RecipeCostBreakdownLine[];
  isCalculating: boolean;
  /** The draft's ingredient rows (for the per-portion detail accordion). */
  ingredients: DraftIngredient[];
  /** Catalog used to resolve ingredient names. */
  catalog: Ingredient[];
  durationDays: number;
  dailyPortions: number;
}

/**
 * Admin-facing cost panel for a recipe draft: headline estimate plus two
 * accordions — the recipe composition per day/portion and the full cost
 * breakdown (ingredients base cost, supplements, charge and minimum profit).
 */
export function RecipeCostBreakdown({
  estimatedCost,
  costPerKg,
  costBreakdown,
  isCalculating,
  ingredients,
  catalog,
  durationDays,
  dailyPortions,
}: RecipeCostBreakdownProps) {
  const t = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [costDetailOpen, setCostDetailOpen] = useState(false);

  const baseLines = costBreakdown.filter((line) => !line.is_supplement);
  const supplementLines = sortSupplementLines(costBreakdown.filter((line) => line.is_supplement));
  const priced = ingredients.filter((item) => item.id > 0 && Number(item.quantity) > 0);

  const lineLabel = (name: string) => {
    const key = BREAKDOWN_LABEL_KEYS[name];
    return key ? t(key as "result") : name;
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          {tRec("estimated_cost")}
          {isCalculating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        </span>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">R$ {formatBRL(estimatedCost)}</div>
          {costPerKg > 0 && <div className="text-xs text-muted-foreground">R$ {formatBRL(costPerKg)}/kg</div>}
          {baseLines.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-primary/20">
              {tRec("base_cost")}: R$ {formatBRL(sumBreakdown(baseLines))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-primary/20 pt-3">
        <button
          type="button"
          onClick={() => setRecipeDetailOpen((open) => !open)}
          className="w-full flex justify-between items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> {tAdmin("view_recipe_breakdown")}
          </span>
          {recipeDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {recipeDetailOpen && (
          <div className="py-3 space-y-3 border-b border-primary/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{tRec("total_duration")}</span>
              <span className="font-semibold">
                {durationDays} {t("days")}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{tRec("daily_portions_label")}</span>
              <span className="font-semibold">
                {dailyPortions} {tRec("portions_per_day_plural")}
              </span>
            </div>
            {priced.length > 0 && (
              <div>
                <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                  <span>{tCommon("ingredient")}</span>
                  <span className="text-right">{tRec("qty_per_day")}</span>
                  <span className="text-right">{tRec("per_portion")}</span>
                </div>
                <ul className="space-y-1.5">
                  {priced.map((item) => {
                    const quantity = Number(item.quantity);
                    const perPortion = quantity / (dailyPortions || 1);
                    return (
                      <li key={item.id} className="grid grid-cols-3 gap-1 text-sm items-center bg-muted/20 px-2 py-1.5 rounded-md">
                        <span className="text-muted-foreground truncate">
                          {catalog.find((ingredient) => ingredient.id === item.id)?.name ?? "?"}
                        </span>
                        <span className="font-medium text-right text-xs">
                          {formatBRL(quantity)} {item.unit}
                        </span>
                        <span className="text-right text-xs text-muted-foreground">
                          {formatBRL(perPortion)} {item.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setCostDetailOpen((open) => !open)}
          className="w-full flex justify-between items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> {tAdmin("view_cost_breakdown")}
          </span>
          {costDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {costDetailOpen &&
          (supplementLines.length > 0 ? (
            <ul className="space-y-1 text-xs mt-3">
              {baseLines.length > 0 && (
                <li className="flex justify-between pb-1.5 mb-0.5 border-b-2 border-primary/30 font-semibold text-foreground text-xs">
                  <span>
                    {tRec("base_cost")} ({tRec("ingredients").toLowerCase()})
                  </span>
                  <span>R$ {formatBRL(sumBreakdown(baseLines))}</span>
                </li>
              )}
              {supplementLines.map((line) => (
                <li
                  key={line.name}
                  className={cn(
                    "flex justify-between pb-1",
                    line.name === CHARGE_LINE
                      ? "border-t-2 border-primary/40 pt-2 mt-1 font-bold text-primary text-sm"
                      : line.name === RESULT_LINE
                        ? "text-emerald-600 font-medium border-t border-dashed border-border pt-1 mt-1"
                        : "text-muted-foreground border-b border-border/30"
                  )}
                >
                  <span>{lineLabel(line.name)}</span>
                  <span>R$ {formatBRL(line.total_cost)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-xs text-muted-foreground italic py-2">{t("add_ingredients_simulate")}</p>
          ))}
      </div>
    </div>
  );
}
