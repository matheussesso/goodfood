"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Pet } from "@/hooks/usePets";
import { Recipe, useRecipes, calculateRecipeCost } from "@/hooks/useRecipes";
import { useIngredients } from "@/hooks/useIngredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { Check, CheckCircle2, ChevronDown, ChevronUp, DollarSign, Dog, FileText, Info, Loader2, Search, Trash2 } from "lucide-react";

/** Display order of the admin cost-breakdown lines returned by the API. */
const ADMIN_BREAKDOWN_ORDER = [
  'Custo de Insumos Adicional', 'Repasse Produção (Cozinha)', 'Repasse Logística',
  'Margem Reserva', 'Custo GFP+MKT', 'Fiscal/Tributário', 'Agenda',
  'Cobrar', 'Resultado (Lucro Mínimo)',
];

/** One line of the cost breakdown returned by /recipes/calculate-cost. */
interface BreakdownLine {
  name: string;
  total_cost: number | string;
  is_supplement?: boolean;
}

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
    name: recipe.name, description: recipe.description || "", instructions: recipe.instructions || "",
    pet_type: recipe.pet_type || "dog", duration_days: recipe.duration_days?.toString() || "15",
    daily_portions: recipe.daily_portions?.toString() || "2", is_active: recipe.is_active,
  }));
  const [recipeIngredients, setRecipeIngredients] = useState<{ id: number; quantity: string; unit: string }[]>(
    () => recipe.ingredients?.map((i) => ({ id: i.id, quantity: String(i.pivot.quantity), unit: i.pivot.unit || i.unit })) || []
  );
  const [selectedPetIds, setSelectedPetIds] = useState<number[]>(() => recipe.pets?.map((p) => p.id) || []);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [costPerKg, setCostPerKg] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<BreakdownLine[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [costDetailOpen, setCostDetailOpen] = useState(false);

  const translateBreakdownName = (name: string) => {
    switch (name) {
      case 'Custo de Insumos Adicional':
        return tCat("additional_ingredient_cost") || name;
      case 'Repasse Produção (Cozinha)':
        return `${tCat("production_transfer")} (${tCat("kitchen") || "Cozinha"})`;
      case 'Repasse Logística':
        return tCat("logistics_transfer");
      case 'Margem Reserva':
        return tCat("reserve_margin");
      case 'Custo GFP+MKT':
        return tCat("gfp_mkt");
      case 'Fiscal/Tributário':
        return tCat("fiscal_tax");
      case 'Agenda':
        return tCat("schedule");
      case 'Cobrar':
        return tCat("charge");
      case 'Resultado (Lucro Mínimo)':
        return `${tCat("result") || "Resultado"} (${tCat("min_profit") || "Lucro Mínimo"})`;
      default:
        return name;
    }
  };

  // Debounced live cost simulation while ingredients/duration change.
  useEffect(() => {
    if (!isOpen) return;
    const fetchCost = async () => {
      const validIngredients = recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0);
      if (validIngredients.length > 0) {
        setIsCalculatingCost(true);
        try {
          const result = await calculateRecipeCost({
            ingredients: validIngredients.map(i => ({ ingredient_id: i.id, quantity: parseFloat(i.quantity), unit: i.unit })),
            duration_days: parseInt(form.duration_days) || 15,
            daily_portions: parseInt(form.daily_portions) || 2,
          });
          setEstimatedCost(result.estimatedCost);
          setCostPerKg(result.costPerKg || 0);
          setCostBreakdown(result.costBreakdown || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCalculatingCost(false);
        }
      } else {
        setEstimatedCost(0);
        setCostPerKg(0);
        setCostBreakdown([]);
      }
    };
    const timeoutId = setTimeout(fetchCost, 500);
    return () => clearTimeout(timeoutId);
  }, [isOpen, recipeIngredients, form.duration_days, form.daily_portions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateRecipe({
      id: recipe.id,
      name: form.name, description: form.description,
      pet_type: form.pet_type, duration_days: parseInt(form.duration_days), daily_portions: parseInt(form.daily_portions),
      is_template: false, is_active: form.is_active, instructions: form.instructions,
      ingredients: recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).map(i => ({ id: i.id, quantity: parseFloat(i.quantity), unit: i.unit })),
      pet_ids: selectedPetIds,
    });
    queryClient.invalidateQueries({ queryKey: ["customer", String(customerId)] });
    onClose();
  }

  const filteredIngredients = ingredients?.filter(ing => {
    const matchSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
    const matchCategory = categoryFilter === "Todos" || ing.category === categoryFilter;
    return matchSearch && matchCategory;
  }) ?? [];

  const baseCostLines = costBreakdown.filter(i => !i.is_supplement);
  const supplementLines = costBreakdown.filter(i => i.is_supplement);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("edit_recipe_title", { name: recipe.name })} className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{tRec("recipe_name")}</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>{tRec("pet_type")}</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.pet_type} onChange={e => setForm({ ...form, pet_type: e.target.value })}>
              <option value="dog">{tPets("dog")}</option>
              <option value="cat">{tPets("cat")}</option>
            </select>
          </div>
        </div>

        {/* Pet linking — shown at top for quick context */}
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
                    onClick={() =>
                      setSelectedPetIds(
                        selected
                          ? selectedPetIds.filter((id) => id !== pet.id)
                          : [...selectedPetIds, pet.id]
                      )
                    }
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
          <div className="space-y-2"><Label>{tRec("duration_days")}</Label><Input type="number" required value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} /></div>
          <div className="space-y-2"><Label>{tRec("portions_per_day_caps")}</Label><Input type="number" required value={form.daily_portions} onChange={e => setForm({ ...form, daily_portions: e.target.value })} /></div>
        </div>

        <div className="space-y-2"><Label>{tRec("description")}</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>{tCat("instructions")}</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={form.instructions}
            onChange={e => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        {/* Ingredient picker */}
        <div className="space-y-3">
          <Label>{tRec("ingredients")}</Label>
          <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-2.5 rounded-lg flex gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{tRec("important_daily_qty")}</span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={tCat("search_ingredient")}
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-2 border rounded-md text-sm bg-background border-input w-36"
            >
              <option value="Todos">{tCommon("all")}</option>
              {Array.from(new Set(ingredients?.map(i => i.category).filter(Boolean))).map(cat => (
                <option key={cat as string} value={cat as string}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1 border rounded-md p-2 bg-muted/20">
            {filteredIngredients.map(ing => {
              const isSelected = recipeIngredients.some(r => r.id === ing.id);
              return (
                <div
                  key={ing.id}
                  onClick={() => {
                    if (isSelected) {
                      setRecipeIngredients(recipeIngredients.filter(r => r.id !== ing.id));
                    } else {
                      setRecipeIngredients([...recipeIngredients, { id: ing.id, quantity: "", unit: ing.unit }]);
                    }
                  }}
                  className={cn(
                    "border p-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between min-h-[56px]",
                    isSelected ? "border-primary bg-primary/10 shadow-sm" : "hover:border-primary/50 hover:bg-muted/50 bg-background"
                  )}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-semibold text-xs leading-tight line-clamp-2">{ing.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-end mt-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{ing.category || tCat("general")}</span>
                  </div>
                </div>
              );
            })}
            {filteredIngredients.length === 0 && (
              <div className="col-span-4 text-center text-xs text-muted-foreground py-4">{tCat("no_ingredients_found")}</div>
            )}
          </div>

          {recipeIngredients.length > 0 ? (
            <div className="space-y-2 border rounded-md p-3 bg-card">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("selected_ingredients_daily")}</p>
              {(() => {
                const ingCostMap = new Map(baseCostLines.map(i => [i.name, i]));
                return recipeIngredients.map((item, idx) => {
                  const ing = ingredients?.find(i => i.id === item.id);
                  const breakdown = ing ? ingCostMap.get(ing.name) : null;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium truncate min-w-0">{ing?.name || "?"}</span>
                      {breakdown && (
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                          R$ {Number(breakdown.total_cost).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <Input
                        type="number"
                        step="0.001"
                        placeholder={tRec("qty_per_day")}
                        className="w-24 h-8 px-2 text-sm shrink-0"
                        value={item.quantity}
                        onChange={e => {
                          const newArr = [...recipeIngredients];
                          newArr[idx].quantity = e.target.value;
                          setRecipeIngredients(newArr);
                        }}
                      />
                      <span className="text-xs text-muted-foreground w-8 text-center shrink-0">{item.unit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">{tCat("no_ingredients_selected")}</p>
          )}
        </div>

        {/* Cost section with both accordions */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              {tRec("estimated_cost")}
              {isCalculatingCost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">R$ {estimatedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              {costPerKg > 0 && (
                <div className="text-xs text-muted-foreground">R$ {costPerKg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg</div>
              )}
              {baseCostLines.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-primary/20">
                  {tRec("base_cost")}: R$ {baseCostLines.reduce((s, i) => s + Number(i.total_cost), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>

          {/* Recipe detail accordion */}
          <div className="border-t border-primary/20 pt-3">
            <button
              type="button"
              onClick={() => setRecipeDetailOpen(v => !v)}
              className="w-full flex justify-between items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {t("view_recipe_breakdown")}</span>
              {recipeDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {recipeDetailOpen && (
              <div className="py-3 space-y-3 border-b border-primary/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{tRec("total_duration")}</span>
                  <span className="font-semibold">{form.duration_days} {tCat("days")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{tRec("daily_portions_label")}</span>
                  <span className="font-semibold">{form.daily_portions} {tRec("portions_per_day_plural")}</span>
                </div>
                {recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).length > 0 && (
                  <div>
                    <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                      <span>{tCommon("ingredient")}</span>
                      <span className="text-right">{t("total_per_day")}</span>
                      <span className="text-right">{tRec("per_portion")}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).map((item, idx) => {
                        const ing = ingredients?.find(i => i.id === item.id);
                        const qty = Number(item.quantity);
                        const portions = Number(form.daily_portions) || 1;
                        const perPortion = qty / portions;
                        return (
                          <li key={idx} className="grid grid-cols-3 gap-1 text-sm items-center bg-muted/20 px-2 py-1.5 rounded-md">
                            <span className="text-muted-foreground truncate">{ing?.name || "?"}</span>
                            <span className="font-medium text-right text-xs">{qty.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.unit}</span>
                            <span className="text-right text-xs text-muted-foreground">{perPortion.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.unit}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cost detail accordion */}
          <div>
            <button
              type="button"
              onClick={() => setCostDetailOpen(v => !v)}
              className="w-full flex justify-between items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> {t("view_cost_breakdown")}</span>
              {costDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {costDetailOpen && (
              supplementLines.length > 0 ? (
                <ul className="space-y-1 text-xs mt-3">
                  {baseCostLines.length > 0 && (
                    <li className="flex justify-between pb-1.5 mb-0.5 border-b-2 border-primary/30 font-semibold text-foreground text-xs">
                      <span>{tRec("base_cost")} ({tRec("ingredients").toLowerCase()})</span>
                      <span>R$ {baseCostLines.reduce((s, i) => s + Number(i.total_cost), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </li>
                  )}
                  {[...supplementLines]
                    .sort((a, b) => {
                      const ai = ADMIN_BREAKDOWN_ORDER.indexOf(a.name);
                      const bi = ADMIN_BREAKDOWN_ORDER.indexOf(b.name);
                      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                    })
                    .map((item, idx) => {
                      const isCobrar = item.name === 'Cobrar';
                      const isResultado = item.name === 'Resultado (Lucro Mínimo)';
                      return (
                        <li
                          key={idx}
                          className={cn(
                            "flex justify-between pb-1",
                            isCobrar
                              ? "border-t-2 border-primary/40 pt-2 mt-1 font-bold text-primary text-sm"
                              : isResultado
                                ? "text-emerald-600 font-medium border-t border-dashed border-border pt-1 mt-1"
                                : "text-muted-foreground border-b border-border/30"
                          )}
                        >
                          <span>{translateBreakdownName(item.name)}</span>
                          <span>R$ {Number(item.total_cost).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="text-center text-xs text-muted-foreground italic py-2">
                  {tRec("add_ingredients_simulate")}
                </p>
              )
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</Button>
          <Button type="submit" disabled={isUpdating || isCalculatingCost}>{t("save_recipe")}</Button>
        </div>
      </form>
    </Modal>
  );
}
