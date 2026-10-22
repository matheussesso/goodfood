"use client";

import { useTranslations } from "next-intl";
import { Loader2, UtensilsCrossed } from "lucide-react";
import type { Pet } from "@/hooks/usePets";
import type { Recipe } from "@/hooks/useRecipes";
import { formatBRL } from "@/lib/format";
import { stepsForPet, totalDays, type MealPlanStep } from "../meal-plan";

interface MealPlanSummaryProps {
  pets: Pet[];
  plan: MealPlanStep[];
  recipesById: Record<number, Recipe>;
  costs: Record<string, number | undefined>;
  total: number;
  isPricing: boolean;
}

/**
 * Order summary of the meal plan: per pet, each recipe with its duration and
 * live price, then the order total.
 *
 * @param pets - Pets of the customer (only those with steps are listed).
 * @param plan - Every step of the plan.
 * @param recipesById - Recipe lookup for names.
 * @param costs - Live price per step key.
 * @param total - Sum of the step prices.
 * @param isPricing - Whether any price is still being calculated.
 */
export function MealPlanSummary({ pets, plan, recipesById, costs, total, isPricing }: MealPlanSummaryProps) {
  const t = useTranslations("Orders");
  const petsInPlan = pets.filter((pet) => plan.some((step) => step.petId === pet.id));

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/20 px-5 py-4">
        <h2 className="font-semibold text-foreground">{t("order_summary")}</h2>
      </div>

      {petsInPlan.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center text-muted-foreground">
          <UtensilsCrossed className="h-8 w-8 opacity-30" aria-hidden="true" />
          <p className="text-sm">{t("select_recipes_hint")}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {petsInPlan.map((pet) => {
            const steps = stepsForPet(plan, pet.id);
            return (
              <div key={pet.id} className="space-y-2 px-5 py-3">
                <p className="flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
                  <span className="truncate">{pet.name}</span>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{t("days_value", { count: totalDays(steps) })}</span>
                </p>
                <ul className="space-y-1.5">
                  {steps.map((step) => {
                    const cost = costs[step.key];
                    return (
                      <li key={step.key} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="flex min-w-0 flex-col text-muted-foreground">
                          <span className="line-clamp-1 text-foreground">{recipesById[step.recipeId]?.name ?? `#${step.recipeId}`}</span>
                          <span className="text-xs">{t("days_value", { count: step.durationDays })}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">
                          {cost === undefined ? "…" : formatBRL(cost, true)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t bg-muted/10 px-5 py-4">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("total")}</span>
        <span className="flex items-center gap-2 text-2xl font-bold text-primary">
          {isPricing && <Loader2 className="h-4 w-4 animate-spin" aria-label={t("price_calculating")} />}
          {formatBRL(total, true)}
        </span>
      </div>
    </div>
  );
}
