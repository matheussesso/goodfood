"use client";

import { useTranslations } from "next-intl";
import { UtensilsCrossed } from "lucide-react";
import { Recipe } from "@/hooks/useRecipes";

/**
 * Renders one recipe picker per 7-day block of the plan ("Semana 1", "Semana 2", ...),
 * each scoped to the given pet's own non-template recipes.
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
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{t("no_recipes_for_pet_short")}</p>;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: totalWeeks }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
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
      ))}
    </div>
  );
}
