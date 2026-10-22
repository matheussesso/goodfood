"use client";

import { useTranslations } from "next-intl";
import { Clock, Info } from "lucide-react";
import { useIngredients } from "@/hooks/useIngredients";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { IngredientPicker } from "@/features/recipes/components/IngredientPicker";
import { RecipeCostBreakdown } from "@/features/recipes/components/RecipeCostBreakdown";
import { useRecipeCostSimulation } from "@/features/recipes/useRecipeCostSimulation";
import { filledIngredients, type RecipeDraft, type RecipeDraftErrors } from "@/features/recipes/draft";
import { MIN_RECIPE_WEIGHT_KG, totalWeightKg } from "@/lib/recipe-weight";

interface RecipeFormProps {
  value: RecipeDraft;
  onChange: (next: RecipeDraft) => void;
  /** Errors to show next to the fields (usually from `validateRecipeDraft` after a submit attempt). */
  errors?: RecipeDraftErrors;
  /** Customers must reach the minimum total weight before a price is shown; admins are exempt. */
  enforceMinimumWeight: boolean;
}

/**
 * Controlled recipe editor shared by pet creation and the new/edit recipe
 * pages: name and notes, daily ingredients, duration/portions and the live
 * cost (priced by the API from today's ingredient costs).
 *
 * @param value - The current draft.
 * @param onChange - Receives the whole updated draft.
 * @param errors - Field errors to display.
 * @param enforceMinimumWeight - Whether the minimum total weight applies.
 */
export function RecipeForm({ value, onChange, errors = {}, enforceMinimumWeight }: RecipeFormProps) {
  const t = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const { ingredients: catalog } = useIngredients();

  const filled = filledIngredients(value);
  const totalKg = totalWeightKg(filled, value.duration_days);
  const belowMinimum = enforceMinimumWeight && totalKg < MIN_RECIPE_WEIGHT_KG;

  const simulation = useRecipeCostSimulation({
    ingredients: value.ingredients,
    durationDays: value.duration_days || 1,
    dailyPortions: value.daily_portions || 1,
    enabled: !belowMinimum,
  });

  const set = <K extends keyof RecipeDraft>(key: K, next: RecipeDraft[K]) => onChange({ ...value, [key]: next });
  const toInt = (raw: string) => (raw === "" ? 0 : Math.trunc(Number(raw)));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <h3 className="flex items-center gap-2 border-b bg-muted/20 px-5 py-4 font-semibold text-foreground">
            <Info className="h-4 w-4 text-primary" aria-hidden="true" /> {t("basic_details")}
          </h3>
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="recipe-name">{t("recipe_name")} *</Label>
              <Input
                id="recipe-name"
                maxLength={255}
                value={value.name}
                aria-invalid={!!errors.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && <p className="text-xs text-destructive">{tCommon("validation_required")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-description">{t("description")}</Label>
              <textarea
                id="recipe-description"
                rows={2}
                value={value.description}
                onChange={(e) => set("description", e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-instructions">{tCat("instructions")}</Label>
              <textarea
                id="recipe-instructions"
                rows={2}
                value={value.instructions}
                placeholder={t("instructions_placeholder")}
                onChange={(e) => set("instructions", e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* IngredientPicker brings its own label and the "daily quantities" note. */}
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="p-5">
            <IngredientPicker
              catalog={catalog ?? []}
              value={value.ingredients}
              onChange={(next) => set("ingredients", next)}
              baseCostLines={simulation.costBreakdown.filter((line) => !line.is_supplement)}
              error={errors.ingredients === "required" ? t("ingredients_required") : undefined}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <h3 className="flex items-center gap-2 border-b bg-muted/20 px-5 py-4 font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" /> {t("planning_and_portions")}
          </h3>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipe-duration">{t("duration_days")}</Label>
              <Input
                id="recipe-duration"
                type="number"
                min={1}
                inputMode="numeric"
                value={value.duration_days || ""}
                aria-invalid={!!errors.duration_days}
                onChange={(e) => set("duration_days", toInt(e.target.value))}
              />
              {errors.duration_days && <p className="text-xs text-destructive">{tCommon("validation_positive_number")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-portions">{t("daily_portions")}</Label>
              <Input
                id="recipe-portions"
                type="number"
                min={1}
                inputMode="numeric"
                value={value.daily_portions || ""}
                aria-invalid={!!errors.daily_portions}
                onChange={(e) => set("daily_portions", toInt(e.target.value))}
              />
              {errors.daily_portions && <p className="text-xs text-destructive">{tCommon("validation_positive_number")}</p>}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-6">
        {belowMinimum ? (
          <div
            role={errors.ingredients === "min_weight" ? "alert" : undefined}
            className={cn(
              "flex gap-2 rounded-xl border p-4 text-sm",
              errors.ingredients === "min_weight" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-card text-muted-foreground"
            )}
          >
            <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {t("weight_warning")}
              <br />
              <strong>{t("current_weight")}</strong> {(totalKg * 1000).toFixed(0)}g
            </span>
          </div>
        ) : (
          <RecipeCostBreakdown
            estimatedCost={simulation.estimatedCost}
            costPerKg={simulation.costPerKg}
            costBreakdown={simulation.costBreakdown}
            isCalculating={simulation.isCalculating}
            ingredients={value.ingredients}
            catalog={catalog ?? []}
            durationDays={value.duration_days || 1}
            dailyPortions={value.daily_portions || 1}
          />
        )}
      </aside>
    </div>
  );
}
