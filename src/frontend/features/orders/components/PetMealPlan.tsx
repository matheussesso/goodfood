"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Cat, Dog, Loader2, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Pet } from "@/hooks/usePets";
import type { Recipe } from "@/hooks/useRecipes";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MIN_PLAN_DAYS, buildTimeline, minimumDurationDays, totalDays, type MealPlanStep } from "../meal-plan";
import { DurationStepper } from "./DurationStepper";
import { formatQuantity, recipeDailyKg, weightQuantity } from "@/features/recipes/recipe-facts";
import { RecipeDetailsDisclosure } from "@/features/recipes/components/RecipeFacts";

/** Segment colors, reused by the timeline bar and the matching step marker. */
export const STEP_TONES = ["bg-primary", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500"] as const;

interface PetMealPlanProps {
  pet: Pet;
  /** The pet's own recipes that can be added to the plan. */
  recipes: Recipe[];
  /** This pet's steps, in feeding order. */
  steps: MealPlanStep[];
  recipesById: Record<number, Recipe>;
  /** Live cost per step key (undefined while loading). */
  costs: Record<string, number | undefined>;
  onAdd: (recipe: Recipe) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onDurationChange: (key: string, days: number, min: number) => void;
}

/**
 * Builds one pet's meal plan: recipes in sequence, each with its own duration,
 * laid out on a day timeline (days 1–15, 16–30…) with its live price.
 *
 * @param pet - The pet the plan is for.
 * @param recipes - Recipes of the pet offered in the "add" list.
 * @param steps - Current steps of this pet.
 * @param recipesById - Lookup of every pet recipe by id.
 * @param costs - Live price of each step.
 * @param onAdd - Appends a recipe to the plan.
 * @param onRemove - Removes a step.
 * @param onMove - Moves a step one place earlier (-1) or later (+1).
 * @param onDurationChange - Sets a step's duration (with the recipe's minimum).
 */
export function PetMealPlan({ pet, recipes, steps, recipesById, costs, onAdd, onRemove, onMove, onDurationChange }: PetMealPlanProps) {
  const t = useTranslations("Orders");
  const tPets = useTranslations("Pets");
  const tOnboarding = useTranslations("Onboarding");
  const tRec = useTranslations("Recipes");

  const PetIcon = pet.type === "cat" ? Cat : Dog;
  const timeline = buildTimeline(steps);
  const days = totalDays(steps);
  const headingId = `meal-plan-${pet.id}`;

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PetIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="truncate font-semibold text-foreground">{pet.name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {pet.breed || (pet.type === "cat" ? tPets("cat") : tPets("dog"))}
          </p>
        </div>
        {steps.length > 0 && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {t("days_value", { count: days })}
          </span>
        )}
      </header>

      {steps.length > 0 && (
        <>
          <div className="flex h-2.5 gap-0.5 px-4" aria-hidden="true">
            {timeline.map(({ step }, index) => (
              <div
                key={step.key}
                className={cn("h-full rounded-full", STEP_TONES[index % STEP_TONES.length])}
                style={{ flexGrow: step.durationDays, flexBasis: 0 }}
              />
            ))}
          </div>

          <ol className="mt-3 divide-y border-t">
            {timeline.map(({ step, startDay, endDay }, index) => {
              const recipe = recipesById[step.recipeId];
              const min = recipe ? minimumDurationDays(recipe) : MIN_PLAN_DAYS;
              const cost = costs[step.key];
              const name = recipe?.name ?? `#${step.recipeId}`;
              const dailyKg = recipe ? recipeDailyKg(recipe) : 0;

              return (
                <li key={step.key} className="space-y-3 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", STEP_TONES[index % STEP_TONES.length])}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{t("plan_days_range", { start: startDay, end: endDay })}</p>
                      {dailyKg > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {tRec("plan_weight_summary", {
                            daily: formatQuantity(weightQuantity(dailyKg), tRec("unit_each")),
                            total: formatQuantity(weightQuantity(dailyKg * step.durationDays), tRec("unit_each")),
                          })}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-amber-600 dark:text-amber-400">
                      {cost === undefined ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("price_calculating")} /> : formatBRL(cost, true)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 sm:pl-9">
                    <DurationStepper
                      value={step.durationDays}
                      min={min}
                      label={name}
                      onChange={(value) => onDurationChange(step.key, value, min)}
                    />
                    <div className="flex items-center">
                      <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => onMove(step.key, -1)} disabled={index === 0} aria-label={t("plan_move_up", { name })}>
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => onMove(step.key, 1)} disabled={index === steps.length - 1} aria-label={t("plan_move_down", { name })}>
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-11 w-11 hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemove(step.key)} aria-label={t("plan_remove", { name })}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  {min > MIN_PLAN_DAYS && <p className="text-xs text-muted-foreground sm:pl-9">{t("plan_min_days_hint", { min })}</p>}
                  {recipe && (
                    <div className="sm:pl-9">
                      <RecipeDetailsDisclosure recipe={recipe} days={step.durationDays} id={`plan-step-${step.key}-details`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div className="border-t bg-muted/20 px-4 py-3">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("no_recipes_for_pet", { name: pet.name })}</p>
            <Link href={`/pets/${pet.id}/recipes/new`}>
              <Button size="sm" variant="outline">{tOnboarding("create_recipe_for_pet", { name: pet.name })}</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {steps.length === 0 ? t("plan_add_first") : t("plan_add_next")}
            </p>
            <div className="flex flex-wrap gap-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => onAdd(recipe)}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">{recipe.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
