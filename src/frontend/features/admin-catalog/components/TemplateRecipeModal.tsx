"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Cat, Dog } from "lucide-react";
import { Recipe, useRecipes } from "@/hooks/useRecipes";
import { useIngredients } from "@/hooks/useIngredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { IngredientPicker } from "@/features/recipes/components/IngredientPicker";
import { RecipeCostBreakdown } from "@/features/recipes/components/RecipeCostBreakdown";
import { useRecipeCostSimulation, type DraftIngredient } from "@/features/recipes/useRecipeCostSimulation";

interface TemplateRecipeModalProps {
  /** Template recipe being edited, or null to create a new one. */
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the translated success message after saving. */
  onSaved: (message: string) => void;
}

type Species = "dog" | "cat" | "both";

/**
 * Admin modal for creating/editing a global template recipe: metadata,
 * dual dog/cat species toggle, ingredient picker with live cost simulation
 * and full admin cost breakdown. Owns all of its state (seeded on mount —
 * the parent must remount it per opening, e.g. rendering it conditionally).
 */
export function TemplateRecipeModal({ recipe, isOpen, onClose, onSaved }: TemplateRecipeModalProps) {
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const { ingredients } = useIngredients();
  const { createRecipe, updateRecipe, isCreating, isUpdating } = useRecipes();

  const [form, setForm] = useState(() =>
    recipe
      ? {
          name: recipe.name,
          description: recipe.description || "",
          instructions: recipe.instructions || "",
          pet_type: (recipe.pet_type || "dog") as Species,
          duration_days: recipe.duration_days?.toString() || "15",
          daily_portions: recipe.daily_portions?.toString() || "2",
          is_active: recipe.is_active,
        }
      : { name: "", description: "", instructions: "", pet_type: "dog" as Species, duration_days: "15", daily_portions: "2", is_active: true }
  );
  const [recipeIngredients, setRecipeIngredients] = useState<DraftIngredient[]>(() =>
    recipe
      ? recipe.ingredients.map((ingredient) => {
          const quantity = parseFloat(ingredient.pivot.quantity);
          return { id: ingredient.id, quantity: Number.isNaN(quantity) ? "" : String(quantity), unit: ingredient.pivot.unit || ingredient.unit };
        })
      : []
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const simulation = useRecipeCostSimulation({
    ingredients: recipeIngredients,
    durationDays: parseInt(form.duration_days) || 15,
    dailyPortions: parseInt(form.daily_portions) || 2,
    enabled: isOpen,
  });

  const isDogActive = form.pet_type === "dog" || form.pet_type === "both";
  const isCatActive = form.pet_type === "cat" || form.pet_type === "both";

  /** Toggles one species in the dual dog/cat selector (never allows none). */
  function toggleSpecies(species: "dog" | "cat") {
    const nextDog = species === "dog" ? !isDogActive : isDogActive;
    const nextCat = species === "cat" ? !isCatActive : isCatActive;
    if (!nextDog && !nextCat) return;

    setForm({ ...form, pet_type: nextDog && nextCat ? "both" : nextDog ? "dog" : "cat" });
    setFormErrors((previous) => ({ ...previous, pet_type: "" }));
  }

  function setField(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value });
    setFormErrors((previous) => ({ ...previous, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t("validation_required");
    if (!form.description.trim()) errors.description = t("validation_required");
    const duration = parseInt(form.duration_days);
    if (!duration || duration <= 0) errors.duration_days = t("validation_positive_number");
    const portions = parseInt(form.daily_portions);
    if (!portions || portions <= 0) errors.daily_portions = t("validation_positive_number");
    const validIngredients = recipeIngredients.filter((item) => item.id > 0 && parseFloat(String(item.quantity)) > 0);
    if (validIngredients.length === 0) errors.ingredients = t("validation_at_least_one_ingredient");

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaveError("");

    try {
      const data = {
        name: form.name.trim(),
        description: form.description,
        pet_type: form.pet_type,
        duration_days: duration,
        daily_portions: portions,
        is_template: true,
        is_active: form.is_active,
        instructions: form.instructions,
        ingredients: validIngredients.map((item) => ({ id: item.id, quantity: parseFloat(String(item.quantity)), unit: item.unit })),
      };

      if (recipe) await updateRecipe({ id: recipe.id, ...data });
      else await createRecipe(data);

      onSaved(recipe ? t("recipe_updated_success") : t("recipe_created_success"));
      onClose();
    } catch {
      setSaveError(tCommon("error"));
    }
  }

  const speciesButton = (species: "dog" | "cat", active: boolean) => {
    const Icon = species === "dog" ? Dog : Cat;
    return (
      <button
        type="button"
        onClick={() => toggleSpecies(species)}
        aria-pressed={active}
        className={cn(
          "cursor-pointer border rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all",
          active
            ? "border-primary bg-primary/10 text-primary shadow-sm"
            : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
        )}
      >
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
        <span className="text-sm font-semibold">{t(species)}</span>
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recipe ? t("edit_recipe") : t("new_recipe")} className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6 px-2">
        {saveError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">{saveError}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">{t("recipe_name")}</Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={formErrors.name ? "border-destructive" : ""}
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("pet_type")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {speciesButton("dog", isDogActive)}
              {speciesButton("cat", isCatActive)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tpl-description">{t("description_label")}</Label>
          <Input
            id="tpl-description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className={formErrors.description ? "border-destructive" : ""}
          />
          {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tpl-instructions">{t("instructions")}</Label>
          <textarea
            id="tpl-instructions"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        <IngredientPicker
          catalog={ingredients ?? []}
          value={recipeIngredients}
          onChange={(next) => {
            setRecipeIngredients(next);
            setFormErrors((previous) => ({ ...previous, ingredients: "" }));
          }}
          baseCostLines={simulation.costBreakdown.filter((line) => !line.is_supplement)}
          error={formErrors.ingredients}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-duration">
              {t("duration")} ({t("days")})
            </Label>
            <Input
              id="tpl-duration"
              type="number"
              value={form.duration_days}
              onChange={(e) => setField("duration_days", e.target.value)}
              className={formErrors.duration_days ? "border-destructive" : ""}
            />
            {formErrors.duration_days && <p className="text-xs text-destructive">{formErrors.duration_days}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-portions">{t("daily_portions")}</Label>
            <Input
              id="tpl-portions"
              type="number"
              value={form.daily_portions}
              onChange={(e) => setField("daily_portions", e.target.value)}
              className={formErrors.daily_portions ? "border-destructive" : ""}
            />
            {formErrors.daily_portions && <p className="text-xs text-destructive">{formErrors.daily_portions}</p>}
          </div>
        </div>

        <RecipeCostBreakdown
          estimatedCost={simulation.estimatedCost}
          costPerKg={simulation.costPerKg}
          costBreakdown={simulation.costBreakdown}
          isCalculating={simulation.isCalculating}
          ingredients={recipeIngredients}
          catalog={ingredients ?? []}
          durationDays={parseInt(form.duration_days) || 15}
          dailyPortions={parseInt(form.daily_portions) || 2}
        />

        <div className="pt-4 flex justify-end gap-2 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating || simulation.isCalculating}>
            {t("save_model")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
