"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, ChevronDown, ChevronUp, Loader2, Salad } from "lucide-react";
import { Recipe } from "@/hooks/useRecipes";
import { useRecipeCycleCost, CYCLE_DAYS } from "@/hooks/useRecipeCycleCost";

/**
 * Detail card for a single week's chosen recipe: description, stats, live
 * 7-day cycle cost, and a collapsible ingredient composition list.
 *
 * @param recipe - The recipe selected for this week.
 * @param t - Subscriptions namespace translator.
 * @param tRec - Recipes namespace translator (reused for the composition label).
 */
function SelectedRecipeDetail({
  recipe,
  t,
  tRec,
}: {
  recipe: Recipe;
  t: ReturnType<typeof useTranslations>;
  tRec: ReturnType<typeof useTranslations>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: cost, isLoading: isCostLoading } = useRecipeCycleCost(recipe);
  const ingredients = recipe.ingredients ?? [];

  return (
    <div className="mt-2 rounded-lg border bg-muted/20 overflow-hidden">
      <div className="px-3 py-2.5">
        {recipe.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{recipe.description}</p>
        )}
        <div className="grid grid-cols-3 divide-x divide-border/50 bg-background/60 rounded-md">
          <div className="px-1.5 py-1.5 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("duration_days")}</span>
            <span className="font-medium text-xs truncate block">{CYCLE_DAYS}d ({t("total_cycles_label")})</span>
          </div>
          <div className="px-1.5 py-1.5 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("portions_per_day_caps").split("/")[0]}</span>
            <span className="font-medium text-xs truncate block flex items-center justify-center gap-1">
              <Salad className="w-3 h-3 shrink-0" />{recipe.daily_portions ?? 1}x
            </span>
          </div>
          <div className="px-1.5 py-1.5 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("estimated_price")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate flex items-center justify-center gap-1">
              {isCostLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                `R$ ${(cost?.estimatedCost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </span>
          </div>
        </div>

        {ingredients.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              <span>{tRec("recipe_composition")} ({ingredients.length})</span>
              {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                {ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-muted-foreground truncate flex-1">{ingredient.name}</span>
                    <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {ingredient.pivot.quantity} {ingredient.pivot.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders one recipe picker per 7-day block of the plan ("Semana 1", "Semana 2", ...),
 * each scoped to the given pet's own non-template recipes. Once a recipe is chosen for
 * a week, shows its description, stats, live 7-day cycle cost and ingredient composition.
 *
 * @param totalWeeks - Number of weekly slots to render (duration_days / 7).
 * @param recipeIds - Selected recipe id for each week, in order (null = not yet chosen).
 * @param options - The recipes available to pick from (already filtered to the chosen pet).
 * @param onChange - Called with the week index and the newly selected recipe id.
 * @param t - Subscriptions namespace translator.
 */
export function WeeklyRecipePicker({
  totalWeeks,
  recipeIds,
  options,
  onChange,
  t,
}: {
  totalWeeks: number;
  recipeIds: (number | null)[];
  options: Recipe[];
  onChange: (weekIndex: number, recipeId: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const tRec = useTranslations("Recipes");

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{t("no_recipes_for_pet_short")}</p>;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: totalWeeks }, (_, index) => {
        const selectedRecipe = options.find((r) => r.id === recipeIds[index]);
        return (
          <div key={index}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t("rotation_order", { n: String(index + 1) })}
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={recipeIds[index] ?? ""}
                  onChange={(e) => onChange(index, Number(e.target.value))}
                >
                  <option value="" disabled>{t("select_recipe_for_week")}</option>
                  {options.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedRecipe && <SelectedRecipeDetail recipe={selectedRecipe} t={t} tRec={tRec} />}
          </div>
        );
      })}
    </div>
  );
}
