"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Dog } from "lucide-react";
import { Pet } from "@/hooks/usePets";
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

interface RecipeEditModalProps {
  /** Recipe being edited. */
  recipe: Recipe;
  /** Customer the recipe belongs to (for cache invalidation). */
  customerId: number;
  /** The customer's pets, offered for linking to the recipe. */
  customerPets: Pet[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Admin modal for editing a customer's recipe: metadata, linked pets,
 * ingredient picker with live cost simulation and detailed breakdowns.
 * Owns all of its form/cost state, seeded from the recipe on mount — the
 * parent must remount it per opening (rendering it conditionally).
 */
export function RecipeEditModal({ recipe, customerId, customerPets, isOpen, onClose }: RecipeEditModalProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const tPets = useTranslations("Pets");
  const queryClient = useQueryClient();
  const { ingredients } = useIngredients();
  const { updateRecipe, isUpdating } = useRecipes();

  const [form, setForm] = useState(() => ({
    name: recipe.name,
    description: recipe.description || "",
    instructions: recipe.instructions || "",
    pet_type: recipe.pet_type || "dog",
    duration_days: recipe.duration_days?.toString() || "15",
    daily_portions: recipe.daily_portions?.toString() || "2",
    is_active: recipe.is_active,
  }));
  const [recipeIngredients, setRecipeIngredients] = useState<DraftIngredient[]>(
    () => recipe.ingredients?.map((ingredient) => ({ id: ingredient.id, quantity: String(ingredient.pivot.quantity), unit: ingredient.pivot.unit || ingredient.unit })) || []
  );
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>(() => recipe.pets?.map((pet) => pet.id) || []);

  const simulation = useRecipeCostSimulation({
    ingredients: recipeIngredients,
    durationDays: parseInt(form.duration_days) || 15,
    dailyPortions: parseInt(form.daily_portions) || 2,
    enabled: isOpen,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateRecipe({
      id: recipe.id,
      name: form.name,
      description: form.description,
      pet_type: form.pet_type,
      duration_days: parseInt(form.duration_days),
      daily_portions: parseInt(form.daily_portions),
      is_template: false,
      is_active: form.is_active,
      instructions: form.instructions,
      ingredients: recipeIngredients
        .filter((item) => item.id > 0 && parseFloat(String(item.quantity)) > 0)
        .map((item) => ({ id: item.id, quantity: parseFloat(String(item.quantity)), unit: item.unit })),
      pet_ids: selectedPetIds,
    });
    queryClient.invalidateQueries({ queryKey: ["customer", String(customerId)] });
    onClose();
  }

  const togglePet = (petId: number) =>
    setSelectedPetIds((current) => (current.includes(petId) ? current.filter((id) => id !== petId) : [...current, petId]));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("edit_recipe_title", { name: recipe.name })} className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rec-name">{tRec("recipe_name")}</Label>
            <Input id="rec-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-type">{tRec("pet_type")}</Label>
            <select
              id="rec-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.pet_type}
              onChange={(e) => setForm({ ...form, pet_type: e.target.value })}
            >
              <option value="dog">{tPets("dog")}</option>
              <option value="cat">{tPets("cat")}</option>
            </select>
          </div>
        </div>

        {customerPets.length > 0 && (
          <div className="space-y-2">
            <Label>{t("link_to_pets")}</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
              {customerPets.map((pet) => {
                const selected = selectedPetIds.includes(pet.id);
                return (
                  <button
                    key={pet.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => togglePet(pet.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-all",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    <Dog className="w-3.5 h-3.5" />
                    {pet.name}
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rec-duration">{tRec("duration_days")}</Label>
            <Input id="rec-duration" type="number" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-portions">{tRec("portions_per_day_caps")}</Label>
            <Input id="rec-portions" type="number" required value={form.daily_portions} onChange={(e) => setForm({ ...form, daily_portions: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-description">{tRec("description")}</Label>
          <Input id="rec-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rec-instructions">{tCat("instructions")}</Label>
          <textarea
            id="rec-instructions"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        <IngredientPicker
          catalog={ingredients ?? []}
          value={recipeIngredients}
          onChange={setRecipeIngredients}
          baseCostLines={simulation.costBreakdown.filter((line) => !line.is_supplement)}
        />

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
          <Button type="submit" disabled={isUpdating || simulation.isCalculating}>
            {t("save_recipe")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
