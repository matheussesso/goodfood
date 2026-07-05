"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Recipe, useRecipes, calculateRecipeCost } from "@/hooks/useRecipes";
import { useIngredients } from "@/hooks/useIngredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { AlertCircle, Cat, Check, CheckCircle2, ChevronDown, ChevronUp, DollarSign, Dog, FileText, Info, Loader2, Search, Trash2 } from "lucide-react";

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

interface TemplateRecipeModalProps {
  /** Template recipe being edited, or null to create a new one. */
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the translated success message after saving. */
  onSaved: (message: string) => void;
}

/**
 * Admin modal for creating/editing a global template recipe: metadata,
 * dual dog/cat species toggle, ingredient picker with live cost simulation
 * and full admin cost breakdown. Owns all of its state (seeded on mount —
 * the parent must remount it per opening, e.g. rendering it conditionally).
 */
export function TemplateRecipeModal({ recipe, isOpen, onClose, onSaved }: TemplateRecipeModalProps) {
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const tRec = useTranslations("Recipes");
  const tAdmin = useTranslations("admin");
  const { ingredients } = useIngredients();
  const { createRecipe, updateRecipe, isCreating, isUpdating } = useRecipes();

  const [form, setForm] = useState(() =>
    recipe
      ? {
          name: recipe.name, description: recipe.description || "", instructions: recipe.instructions || "",
          pet_type: recipe.pet_type || "dog", duration_days: recipe.duration_days?.toString() || "15",
          daily_portions: recipe.daily_portions?.toString() || "2", is_active: recipe.is_active,
        }
      : { name: "", description: "", instructions: "", pet_type: "dog", duration_days: "15", daily_portions: "2", is_active: true }
  );
  const [recipeIngredients, setRecipeIngredients] = useState<{ id: number; quantity: string; unit: string }[]>(() =>
    recipe
      ? recipe.ingredients.map(i => {
          const n = parseFloat(i.pivot.quantity);
          return { id: i.id, quantity: isNaN(n) ? "" : String(n), unit: i.pivot.unit || i.unit };
        })
      : []
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [costPerKg, setCostPerKg] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<BreakdownLine[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [costDetailOpen, setCostDetailOpen] = useState(false);
  const [editingIngIdx, setEditingIngIdx] = useState<number | null>(null);

  const translateBreakdownName = (name: string) => {
    switch (name) {
      case 'Custo de Insumos Adicional':
        return t("additional_ingredient_cost") || name;
      case 'Repasse Produção (Cozinha)':
        return `${t("production_transfer")} (${t("kitchen") || "Cozinha"})`;
      case 'Repasse Logística':
        return t("logistics_transfer");
      case 'Margem Reserva':
        return t("reserve_margin");
      case 'Custo GFP+MKT':
        return t("gfp_mkt");
      case 'Fiscal/Tributário':
        return t("fiscal_tax");
      case 'Agenda':
        return t("schedule");
      case 'Cobrar':
        return t("charge");
      case 'Resultado (Lucro Mínimo)':
        return `${t("result") || "Resultado"} (${t("min_profit") || "Lucro Mínimo"})`;
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

  /** Toggles one species in the dual dog/cat selector (never allows none). */
  function toggleSpecies(species: "dog" | "cat") {
    const current = form.pet_type;
    const isCat = current === "cat" || current === "both";
    const isDog = current === "dog" || current === "both";

    const nextDog = species === "dog" ? !isDog : isDog;
    const nextCat = species === "cat" ? !isCat : isCat;

    let next = "";
    if (nextDog && nextCat) next = "both";
    else if (nextDog) next = "dog";
    else if (nextCat) next = "cat";

    if (next !== "") {
      setForm({ ...form, pet_type: next });
      setFormErrors(p => ({ ...p, pet_type: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t("validation_required");
    if (!form.description.trim()) errors.description = t("validation_required");
    const dur = parseInt(form.duration_days);
    if (!dur || dur <= 0) errors.duration_days = t("validation_positive_number");
    const portions = parseInt(form.daily_portions);
    if (!portions || portions <= 0) errors.daily_portions = t("validation_positive_number");
    const validIngredients = recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0);
    if (validIngredients.length === 0) errors.ingredients = t("validation_at_least_one_ingredient");

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaveError("");

    try {
      const data = {
        name: form.name.trim(), description: form.description,
        pet_type: form.pet_type, duration_days: dur, daily_portions: portions,
        is_template: true, is_active: form.is_active, instructions: form.instructions,
        ingredients: validIngredients.map(i => ({ id: i.id, quantity: parseFloat(i.quantity), unit: i.unit })),
      };

      if (recipe) await updateRecipe({ id: recipe.id, ...data });
      else await createRecipe(data);

      onSaved(recipe ? t("recipe_updated_success") : t("recipe_created_success"));
      onClose();
    } catch {
      setSaveError(tCommon("error"));
    }
  }

  const filteredIngredients = (ingredients ?? [])
    .filter(ing => {
      const matchSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
      const matchCategory = categoryFilter === "Todos" || ing.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const baseCostLines = costBreakdown.filter(i => !i.is_supplement);
  const supplementLines = costBreakdown.filter(i => i.is_supplement);
  const isDogActive = form.pet_type === "dog" || form.pet_type === "both";
  const isCatActive = form.pet_type === "cat" || form.pet_type === "both";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recipe ? t("edit_recipe") : t("new_recipe")} className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6 px-2">
        {saveError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {saveError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("recipe_name")}</Label>
            <Input
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors(p => ({ ...p, name: "" })); }}
              className={formErrors.name ? "border-destructive" : ""}
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("pet_type")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => toggleSpecies("dog")}
                className={cn(
                  "cursor-pointer border-2 rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all",
                  isDogActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                )}
              >
                <Dog className={cn("w-5 h-5", isDogActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-semibold">{t("dog")}</span>
              </div>

              <div
                onClick={() => toggleSpecies("cat")}
                className={cn(
                  "cursor-pointer border-2 rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all",
                  isCatActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                )}
              >
                <Cat className={cn("w-5 h-5", isCatActive ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-semibold">{t("cat")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("description_label")}</Label>
          <Input
            value={form.description}
            onChange={e => { setForm({ ...form, description: e.target.value }); setFormErrors(p => ({ ...p, description: "" })); }}
            className={formErrors.description ? "border-destructive" : ""}
          />
          {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t("instructions")}</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={form.instructions}
            onChange={e => setForm({ ...form, instructions: e.target.value })}
          />
        </div>

        {/* Ingredient picker — visual grid, same pattern as customer builder */}
        <div className="space-y-3">
          <Label>{tRec("ingredients")}</Label>
          <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-2.5 rounded-lg flex gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{tRec("important_daily_qty")}</span>
          </div>

          {/* Search + category filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("search_ingredient")}
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

          {/* Clickable ingredient grid */}
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
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{ing.category || t("general")}</span>
                  </div>
                </div>
              );
            })}
            {filteredIngredients.length === 0 && (
              <div className="col-span-4 text-center text-xs text-muted-foreground py-4">{t("no_ingredients_found")}</div>
            )}
          </div>

          {/* Selected ingredients with quantities */}
          {recipeIngredients.length > 0 ? (
            <div className="border rounded-md p-3 bg-card space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1.5 border-b">{tAdmin("selected_ingredients_daily")}</p>
              {(() => {
                const ingCostMap = new Map(baseCostLines.map(i => [i.name, i]));
                return recipeIngredients.map((item, idx) => {
                  const ing = ingredients?.find(i => i.id === item.id);
                  const breakdown = ing ? ingCostMap.get(ing.name) : null;
                  return (
                    <div key={idx} className="flex items-center gap-3 px-2.5 py-2 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium truncate min-w-0">{ing?.name || "?"}</span>
                      {breakdown && (
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                          R$ {Number(breakdown.total_cost).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <div className="flex items-center rounded-md border overflow-hidden shrink-0 bg-background">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          className="w-24 px-2 py-1.5 text-sm text-right border-0 focus:outline-none focus:ring-0 bg-background"
                          value={editingIngIdx === idx
                            ? (() => {
                                const raw = item.quantity;
                                if (raw.endsWith(".") || raw.endsWith(",")) return raw;
                                const n = parseFloat(raw.replace(",", "."));
                                return isNaN(n) || n === 0 ? "" : String(n);
                              })()
                            : (() => {
                                const n = parseFloat(item.quantity);
                                return isNaN(n) || n === 0 ? (item.quantity || "") : n.toLocaleString("pt-BR", { maximumFractionDigits: 3, useGrouping: false });
                              })()
                          }
                          onFocus={() => setEditingIngIdx(idx)}
                          onBlur={() => setEditingIngIdx(null)}
                          onChange={e => {
                            const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".").replace(/^(\d*\.?\d*).*/, "$1");
                            const newArr = [...recipeIngredients];
                            newArr[idx].quantity = v;
                            setRecipeIngredients(newArr);
                          }}
                        />
                        <span className="px-2 py-1.5 bg-muted text-xs font-medium text-muted-foreground border-l shrink-0">{item.unit}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
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
            <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">{t("no_ingredients")}</p>
          )}
          {formErrors.ingredients && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formErrors.ingredients}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("duration")} ({t("days")})</Label>
            <Input
              type="number"
              value={form.duration_days}
              onChange={e => { setForm({ ...form, duration_days: e.target.value }); setFormErrors(p => ({ ...p, duration_days: "" })); }}
              className={formErrors.duration_days ? "border-destructive" : ""}
            />
            {formErrors.duration_days && <p className="text-xs text-destructive">{formErrors.duration_days}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t("daily_portions")}</Label>
            <Input
              type="number"
              value={form.daily_portions}
              onChange={e => { setForm({ ...form, daily_portions: e.target.value }); setFormErrors(p => ({ ...p, daily_portions: "" })); }}
              className={formErrors.daily_portions ? "border-destructive" : ""}
            />
            {formErrors.daily_portions && <p className="text-xs text-destructive">{formErrors.daily_portions}</p>}
          </div>
        </div>

        {/* Admin cost breakdown — full detail with accordions */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              {t("estimated_cost")}
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
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {tAdmin("view_recipe_breakdown")}</span>
              {recipeDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {recipeDetailOpen && (
              <div className="py-3 space-y-3 border-b border-primary/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{tRec("total_duration")}</span>
                  <span className="font-semibold">{form.duration_days} {t("days")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{tRec("daily_portions_label")}</span>
                  <span className="font-semibold">{form.daily_portions} {tRec("portions_per_day_plural")}</span>
                </div>
                {recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).length > 0 && (
                  <div>
                    <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                      <span>{tCommon("ingredient")}</span>
                      <span className="text-right">{tRec("qty_per_day")}</span>
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
              <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> {tAdmin("view_cost_breakdown")}</span>
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
                  {t("add_ingredients_simulate")}
                </p>
              )
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</Button>
          <Button type="submit" disabled={isCreating || isUpdating || isCalculatingCost}>{t("save_model")}</Button>
        </div>
      </form>
    </Modal>
  );
}
