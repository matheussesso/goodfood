"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useIngredients, Ingredient } from "@/hooks/useIngredients";
import { useRecipes, Recipe, calculateRecipeCost } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Trash2, Loader2, BookOpen, Apple, Settings2, Save, AlertCircle, Search, Filter, LayoutGrid, List, CheckCircle2, Check, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, DollarSign, FileText, X, Dog, Cat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, GeneralSettings } from "@/hooks/useSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import { generalSettingsSchema } from "@/lib/validations/settings";
import { useForm } from "react-hook-form";

/** ATM-style currency mask: raw digit string (cents) → "R$ X.XXX,XX" */
function formatCurrencyMask(digits: string): string {
  const num = parseInt(digits || "0", 10) || 0;
  return "R$ " + (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CatalogPage() {
  const tNav = useTranslations("Navigation");
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const tRec = useTranslations("Recipes");
  const { user } = useAuth();

  const translateCategory = (cat?: string) => {
    if (!cat) return t("other");
    switch (cat) {
      case 'Proteína': return t("protein");
      case 'Carboidrato': return t("carb");
      case 'Vegetal': return t("vegetable");
      case 'Gordura': return t("fat");
      case 'Suplemento': return t("supplement");
      case 'Outro': return t("other");
      default: return cat;
    }
  };

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
  const [activeTab, setActiveTab] = useState<"ingredients" | "recipes" | "settings">("ingredients");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Settings Hooks & State
  const { settings, isLoading: isLoadingSettings, updateSettings, isUpdating: isUpdatingSettings } = useSettings();
  const { register: registerSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings, formState: { errors: settingsErrors } } = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
  });

  useEffect(() => {
    if (settings) resetSettings(settings);
  }, [settings, resetSettings]);

  const onSettingsSubmit = async (data: GeneralSettings) => {
    try {
      await updateSettings(data);
      alert(tCommon("success"));
    } catch (error) {
      alert(tCommon("error"));
    }
  };

  const settingsSections = [
    {
      title: t("production_transfer"),
      fields: [
        { name: "production_fixed_value", label: t("fixed_value"), type: "number", step: "0.01" },
        { name: "production_days_division", label: t("days_division"), type: "number", step: "1" },
        { name: "production_weight_multiplier", label: t("weight_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("logistics_transfer"),
      fields: [
        { name: "logistics_fixed_multiplier", label: t("fixed_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("reserve_margin"),
      fields: [
        { name: "reserve_margin_fixed_value", label: t("fixed_value"), type: "number", step: "0.01" },
        { name: "reserve_margin_transfer_multiplier", label: t("transfer_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("gfp_mkt"),
      fields: [
        { name: "gfp_mkt_fixed_value", label: t("fixed_value"), type: "number", step: "0.01" },
        { name: "gfp_mkt_fixed_multiplier", label: t("fixed_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("fiscal_tax"),
      fields: [
        { name: "fiscal_fixed_multiplier", label: t("fixed_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("charge"),
      fields: [
        { name: "charge_fixed_value", label: t("fixed_value"), type: "number", step: "0.01" },
        { name: "charge_fixed_multiplier", label: t("fixed_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("schedule"),
      fields: [
        { name: "schedule_fixed_value", label: t("fixed_value"), type: "number", step: "0.01" },
        { name: "schedule_fixed_multiplier", label: t("fixed_multiplier"), type: "number", step: "0.001" },
      ]
    },
    {
      title: t("difficulty_ingredients"),
      fields: [
        { name: "difficulty_fixed_value", label: t("difficulty_fixed_value"), type: "number", step: "0.01" },
        { name: "ingredient_cost_days_division", label: t("ingredient_cost_days_division"), type: "number", step: "1" },
      ]
    }
  ];

  // Ingredients Hooks & State
  const { 
    ingredients, isLoading: isLoadingIng, 
    createIngredient, updateIngredient, deleteIngredient, 
    isCreating: isCreatingIng, isUpdating: isUpdatingIng 
  } = useIngredients();
  
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [ingForm, setIngForm] = useState({
    name: "", category: "Outro", description: "", unit: "kg", cost_per_unit: "", loss_rate: "0", difficulty_multiplier: "1.0", is_active: true
  });

  // Recipes Hooks & State
  const { 
    recipes, isLoading: isLoadingRec, 
    createRecipe, updateRecipe, deleteRecipe, 
    isCreating: isCreatingRec, isUpdating: isUpdatingRec 
  } = useRecipes();

  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(true);
  const [editingRec, setEditingRec] = useState<Recipe | null>(null);
  const [recForm, setRecForm] = useState({
    name: "", description: "", pet_type: "dog", duration_days: "15", daily_portions: "2", is_active: true, instructions: ""
  });
  const [recipeIngredients, setRecipeIngredients] = useState<{id: number, quantity: string, unit: string}[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [adminIngSearch, setAdminIngSearch] = useState("");
  const [adminIngCategory, setAdminIngCategory] = useState("all");
  const [adminIngSort, setAdminIngSort] = useState<"name" | "category" | "price">("name");
  const [adminIngPage, setAdminIngPage] = useState(1);
  const [ingFormErrors, setIngFormErrors] = useState<Record<string, string>>({});
  const [ingFeedback, setIngFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const INGREDIENTS_PER_PAGE = 12;

  const filteredSortedIng = useMemo(() => {
    if (!ingredients) return [];
    let result = ingredients.filter(ing => {
      if (adminIngCategory !== "all" && ing.category !== adminIngCategory) return false;
      if (adminIngSearch && !ing.name.toLowerCase().includes(adminIngSearch.toLowerCase())) return false;
      return true;
    });
    if (adminIngSort === "name") {
      result = result.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    } else if (adminIngSort === "category") {
      result = result.slice().sort((a, b) =>
        (a.category ?? "").localeCompare(b.category ?? "", "pt-BR") || a.name.localeCompare(b.name, "pt-BR")
      );
    } else {
      result = result.slice().sort((a, b) => Number(a.cost_per_unit) - Number(b.cost_per_unit));
    }
    return result;
  }, [ingredients, adminIngSearch, adminIngCategory, adminIngSort]);

  const totalIngPages = Math.max(1, Math.ceil(filteredSortedIng.length / INGREDIENTS_PER_PAGE));

  const paginatedIng = useMemo(() => {
    const start = (adminIngPage - 1) * INGREDIENTS_PER_PAGE;
    return filteredSortedIng.slice(start, start + INGREDIENTS_PER_PAGE);
  }, [filteredSortedIng, adminIngPage, INGREDIENTS_PER_PAGE]);

  useEffect(() => {
    setAdminIngPage(1);
  }, [adminIngSearch, adminIngCategory, adminIngSort, viewMode]);

  const [adminRecCategoryFilter, setAdminRecCategoryFilter] = useState("Todos");
  const [adminRecSearch, setAdminRecSearch] = useState("");
  const [adminRecPetFilter, setAdminRecPetFilter] = useState("all");
  const [recipesViewMode, setRecipesViewMode] = useState<"grid" | "list">("grid");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [recCostPerKg, setRecCostPerKg] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [costDetailOpen, setCostDetailOpen] = useState(false);
  const [recFormErrors, setRecFormErrors] = useState<Record<string, string>>({});
  const [recFeedback, setRecFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [editingIngIdx, setEditingIngIdx] = useState<number | null>(null);

  const ADMIN_BREAKDOWN_ORDER = [
    'Custo de Insumos Adicional',
    'Repasse Produção (Cozinha)',
    'Repasse Logística',
    'Margem Reserva',
    'Custo GFP+MKT',
    'Fiscal/Tributário',
    'Agenda',
    'Cobrar',
    'Resultado (Lucro Mínimo)',
  ];

  useEffect(() => {
    const fetchCost = async () => {
      const validIngredients = recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0);
      if (validIngredients.length > 0) {
        setIsCalculatingCost(true);
        try {
          const result = await calculateRecipeCost({
            ingredients: validIngredients.map(i => ({ ingredient_id: i.id, quantity: parseFloat(i.quantity), unit: i.unit })),
            duration_days: parseInt(recForm.duration_days) || 15,
            daily_portions: parseInt(recForm.daily_portions) || 2
          });
          setEstimatedCost(result.estimatedCost);
          setRecCostPerKg(result.costPerKg || 0);
          setCostBreakdown(result.costBreakdown || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCalculatingCost(false);
        }
      } else {
        setEstimatedCost(0);
        setRecCostPerKg(0);
        setCostBreakdown([]);
      }
    };
    
    // Debounce to avoid too many requests
    const timeoutId = setTimeout(fetchCost, 500);
    return () => clearTimeout(timeoutId);
  }, [recipeIngredients, recForm.duration_days, recForm.daily_portions, calculateRecipeCost]);

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-destructive">{tCommon("access_denied")}</div>;
  }

  // --- Ingredients Handlers ---
  const handleOpenIngModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIng(ing);
      setIngForm({
        name: ing.name, category: ing.category || "Outro", description: ing.description || "", unit: ing.unit,
        cost_per_unit: Math.round((ing.cost_per_unit ?? 0) * 100).toString(),
        loss_rate: Number(ing.loss_rate).toFixed(2),
        difficulty_multiplier: Number(ing.difficulty_multiplier).toFixed(2),
        is_active: ing.is_active,
      });
    } else {
      setEditingIng(null);
      setIngForm({ name: "", category: "Outro", description: "", unit: "kg", cost_per_unit: "", loss_rate: "0.00", difficulty_multiplier: "1.00", is_active: true });
    }
    setIsIngModalOpen(true);
  };

  const handleIngSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!ingForm.name.trim()) errors.name = t("validation_required");
    // cost_per_unit stored as raw digits (cents); convert back to decimal
    const costCents = parseInt(ingForm.cost_per_unit || "0", 10) || 0;
    const cost = costCents / 100;
    if (costCents <= 0) errors.cost_per_unit = t("validation_positive_number");
    const loss = parseFloat(ingForm.loss_rate);
    if (isNaN(loss) || loss < 0) errors.loss_rate = t("validation_non_negative");
    const diff = parseFloat(ingForm.difficulty_multiplier);
    if (isNaN(diff) || diff <= 0) errors.difficulty_multiplier = t("validation_positive_number");

    if (Object.keys(errors).length > 0) {
      setIngFormErrors(errors);
      return;
    }
    setIngFormErrors({});

    try {
      const data = {
        name: ingForm.name.trim(), category: ingForm.category, description: ingForm.description,
        unit: ingForm.unit, cost_per_unit: cost, loss_rate: loss,
        difficulty_multiplier: diff, is_active: ingForm.is_active,
      };
      if (editingIng) await updateIngredient({ id: editingIng.id, ...data });
      else await createIngredient(data);

      setIsIngModalOpen(false);
      setActiveTab("ingredients");
      const msg = editingIng ? t("ingredient_updated_success") : t("ingredient_created_success");
      setIngFeedback({ type: "success", message: msg });
      setTimeout(() => setIngFeedback(null), 4000);
    } catch {
      setIngFeedback({ type: "error", message: tCommon("error") });
      setTimeout(() => setIngFeedback(null), 4000);
    }
  };

  const handleDeleteIng = async (id: number) => {
    if (confirm(tCommon("confirm_delete"))) await deleteIngredient(id);
  };

  // --- Recipes Handlers ---
  const handleOpenRecModal = (rec?: Recipe, type: "template" | "customer" = "template") => {
    setIngredientSearch("");
    setAdminRecCategoryFilter("Todos");
    setEstimatedCost(0);
    setRecCostPerKg(0);
    setCostBreakdown([]);
    setRecFormErrors({});
    setIsEditingTemplate(type === "template");
    if (rec) {
      setEditingRec(rec);
      setRecForm({
        name: rec.name, description: rec.description || "", instructions: rec.instructions || "",
        pet_type: rec.pet_type || "dog", duration_days: rec.duration_days?.toString() || "15",
        daily_portions: rec.daily_portions?.toString() || "2", is_active: rec.is_active
      });
      setRecipeIngredients(rec.ingredients.map(i => {
        const n = parseFloat(i.pivot.quantity);
        return { id: i.id, quantity: isNaN(n) ? "" : String(n), unit: i.pivot.unit || i.unit };
      }));
    } else {
      setEditingRec(null);
      setRecForm({ name: "", description: "", instructions: "", pet_type: "dog", duration_days: "15", daily_portions: "2", is_active: true });
      setRecipeIngredients([]);
    }
    setIsRecModalOpen(true);
  };

  const handleRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!recForm.name.trim()) errors.name = t("validation_required");
    if (!recForm.description.trim()) errors.description = t("validation_required");
    const dur = parseInt(recForm.duration_days);
    if (!dur || dur <= 0) errors.duration_days = t("validation_positive_number");
    const portions = parseInt(recForm.daily_portions);
    if (!portions || portions <= 0) errors.daily_portions = t("validation_positive_number");
    const validIngredients = recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0);
    if (validIngredients.length === 0) errors.ingredients = t("validation_at_least_one_ingredient");

    if (Object.keys(errors).length > 0) {
      setRecFormErrors(errors);
      return;
    }
    setRecFormErrors({});

    try {
      const data = {
        name: recForm.name.trim(), description: recForm.description,
        pet_type: recForm.pet_type, duration_days: dur, daily_portions: portions,
        is_template: isEditingTemplate, is_active: recForm.is_active, instructions: recForm.instructions,
        ingredients: validIngredients.map(i => ({ id: i.id, quantity: parseFloat(i.quantity), unit: i.unit }))
      };

      if (editingRec) await updateRecipe({ id: editingRec.id, ...data });
      else await createRecipe(data);

      setIsRecModalOpen(false);
      setActiveTab("recipes");
      const msg = editingRec ? t("recipe_updated_success") : t("recipe_created_success");
      setRecFeedback({ type: "success", message: msg });
      setTimeout(() => setRecFeedback(null), 4000);
    } catch {
      setRecFeedback({ type: "error", message: tCommon("error") });
      setTimeout(() => setRecFeedback(null), 4000);
    }
  };

  const handleDeleteRec = async (id: number) => {
    if (confirm(tCommon("confirm_delete"))) await deleteRecipe(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{tNav("catalog")}</h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab("ingredients")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "ingredients" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Apple className="inline-block w-4 h-4 mr-2" /> {t("ingredients")}
          </button>
          <button 
            onClick={() => setActiveTab("recipes")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "recipes" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <BookOpen className="inline-block w-4 h-4 mr-2" /> {t("recipes")}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "settings" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Settings2 className="inline-block w-4 h-4 mr-2" /> {t("settings")}
          </button>
        </div>
      </div>

      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{t("pricing_warning_title")}</p>
              <p className="text-sm mt-0.5 text-amber-600 dark:text-amber-500">{t("settings_warning")}</p>
            </div>
          </div>

          {isLoadingSettings ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : (
            <form onSubmit={handleSettingsSubmit(onSettingsSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsSections.map((section, idx) => (
                  <div key={idx} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Settings2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                      </div>
                      <div className={cn("gap-4", section.fields.length > 1 ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col")}>
                        {section.fields.map((field) => (
                          <div key={field.name} className="space-y-1.5">
                            <label className="block text-xs font-medium text-muted-foreground">
                              {field.label}
                            </label>
                            <Input
                              type={field.type}
                              step={field.step}
                              {...registerSettings(field.name as keyof GeneralSettings, { valueAsNumber: true })}
                            />
                            {settingsErrors[field.name as keyof GeneralSettings] && (
                              <span className="text-xs text-destructive">{t("invalid")}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" size="lg" disabled={isUpdatingSettings} className="shadow-md min-w-[180px]">
                  {isUpdatingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {t("save_settings")}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === "ingredients" && (
        <div className="space-y-4">
          {/* Success / error feedback banner */}
          {ingFeedback && (
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium",
              ingFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            )}>
              {ingFeedback.type === "success"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />
              }
              <span className="flex-1">{ingFeedback.message}</span>
              <button onClick={() => setIngFeedback(null)} className="p-0.5 hover:opacity-70 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search_ingredient")}
                className="pl-9 h-10 w-full"
                value={adminIngSearch}
                onChange={e => setAdminIngSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
                value={adminIngCategory}
                onChange={e => setAdminIngCategory(e.target.value)}
              >
                <option value="all">{tCommon("all")}</option>
                <option value="Proteína">{t("protein")}</option>
                <option value="Carboidrato">{t("carb")}</option>
                <option value="Vegetal">{t("vegetable")}</option>
                <option value="Gordura">{t("fat")}</option>
                <option value="Suplemento">{t("supplement")}</option>
                <option value="Outro">{t("other")}</option>
              </select>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[150px]"
                value={adminIngSort}
                onChange={e => setAdminIngSort(e.target.value as "name" | "category" | "price")}
              >
                <option value="name">{t("sort_name")}</option>
                <option value="category">{t("sort_category")}</option>
                <option value="price">{t("sort_price")}</option>
              </select>
              <div className="hidden md:flex border rounded-md">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-r-none" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-l-none" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
              </div>
              <Button onClick={() => handleOpenIngModal()}><Plus className="h-4 w-4 mr-2" /> {t("new_ingredient")}</Button>
            </div>
          </div>

          {isLoadingIng ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedIng.map(ing => (
                <Card key={ing.id} className="group hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-1" title={ing.name}>{ing.name}</h4>
                        <span className={cn(
                          "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1",
                          ing.category === 'Proteína' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          ing.category === 'Carboidrato' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          ing.category === 'Vegetal' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          ing.category === 'Gordura' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          ing.category === 'Suplemento' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-muted text-muted-foreground"
                        )}>{translateCategory(ing.category) || t("other")}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenIngModal(ing)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteIng(ing.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 rounded-lg">
                      <div className="px-2 py-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("cost")}</span>
                        <span className="font-semibold text-xs text-primary">R$ {Number(ing.cost_per_unit).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="block text-[9px] text-muted-foreground">/{ing.unit === 'g' || ing.unit === 'kg' ? 'kg' : ing.unit === 'l' || ing.unit === 'ml' ? 'L' : 'un'}</span>
                      </div>
                      <div className="px-2 py-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Perda</span>
                        <span className="font-medium text-xs">{ing.loss_rate}x</span>
                      </div>
                      <div className="px-2 py-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Dific.</span>
                        <span className="font-medium text-xs">x{ing.difficulty_multiplier}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredSortedIng.length === 0 && (
                <div className="col-span-4 p-12 text-center text-muted-foreground border rounded-lg border-dashed">
                  <Apple className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p>{t("no_ingredients")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t("name")} / {t("category")}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("unit")}</th>
                    <th className="px-6 py-3 font-medium text-right">{t("base_price_table_header")}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("loss_rate")}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("difficulty_multiplier")}</th>
                    <th className="px-6 py-3 font-medium text-right">{tCommon("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedIng.map(ing => (
                    <tr key={ing.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold">{ing.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ing.category || 'Sem Categoria'}</div>
                      </td>
                      <td className="px-6 py-3 text-center uppercase text-xs font-medium">{ing.unit}</td>
                      <td className="px-6 py-3 text-right font-semibold text-primary">R$ {Number(ing.cost_per_unit).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3 text-center">{ing.loss_rate}x</td>
                      <td className="px-6 py-3 text-center">x{ing.difficulty_multiplier}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenIngModal(ing)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteIng(ing.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalIngPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {t("page_info", { current: adminIngPage, total: totalIngPages })}
                {" · "}
                {filteredSortedIng.length} {filteredSortedIng.length === 1 ? t("ingredient") : t("ingredients")}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAdminIngPage(p => p - 1)}
                  disabled={adminIngPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalIngPages) }, (_, i) => {
                  const page = totalIngPages <= 5
                    ? i + 1
                    : adminIngPage <= 3
                      ? i + 1
                      : adminIngPage >= totalIngPages - 2
                        ? totalIngPages - 4 + i
                        : adminIngPage - 2 + i;
                  return (
                    <Button
                      key={page}
                      variant={page === adminIngPage ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setAdminIngPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAdminIngPage(p => p + 1)}
                  disabled={adminIngPage === totalIngPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "recipes" && (
        <div className="space-y-4">
          {/* Success / error feedback banner */}
          {recFeedback && (
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium",
              recFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            )}>
              {recFeedback.type === "success"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />
              }
              <span className="flex-1">{recFeedback.message}</span>
              <button onClick={() => setRecFeedback(null)} className="p-0.5 hover:opacity-70 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search_template")}
                className="pl-9 h-10 w-full"
                value={adminRecSearch}
                onChange={e => setAdminRecSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
                value={adminRecPetFilter}
                onChange={e => setAdminRecPetFilter(e.target.value)}
              >
                <option value="all">{t("all_species_admin")}</option>
                <option value="dog">{t("dog")}</option>
                <option value="cat">{t("cat")}</option>
              </select>
              <div className="hidden md:flex border rounded-md">
                <Button variant={recipesViewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-r-none" onClick={() => setRecipesViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={recipesViewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-l-none" onClick={() => setRecipesViewMode("list")}><List className="h-4 w-4" /></Button>
              </div>
              <Button onClick={() => handleOpenRecModal()}><Plus className="h-4 w-4 mr-2" /> {t("new_recipe")}</Button>
            </div>
          </div>

          {isLoadingRec ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : recipesViewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recipes?.filter(r => {
                if (!r.is_template) return false;
                if (adminRecSearch && !r.name.toLowerCase().includes(adminRecSearch.toLowerCase())) return false;
                if (adminRecPetFilter !== "all" && r.pet_type !== adminRecPetFilter) return false;
                return true;
              }).map(rec => (
                <Card key={rec.id} className="flex flex-col overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="p-4 pb-3 border-b bg-muted/20 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base line-clamp-1">{rec.name}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 min-h-[1.25rem]">{rec.description || tRec("no_description")}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenRecModal(rec, "template")}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-4 gap-x-2 gap-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">{tRec("pet_type")}</span>
                        <span className="font-medium text-xs">{rec.pet_type === 'cat' ? t("cat") : rec.pet_type === 'dog' ? t("dog") : t("general")}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">{t("duration")}</span>
                        <span className="font-medium text-xs">{rec.duration_days}d</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">{tRec("portions_per_day_caps").split("/")[0]}</span>
                        <span className="font-medium text-xs">{rec.daily_portions}/dia</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">{tRec("estimated_cost")}</span>
                        <span className="font-semibold text-xs text-amber-600 dark:text-amber-400">R$ {Number(rec.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    {rec.ingredients && rec.ingredients.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{tRec("recipe_composition")}</p>
                        <ul className="space-y-1">
                          {(expandedRecipes.has(rec.id) ? rec.ingredients : rec.ingredients.slice(0, 3)).map(i => (
                            <li key={i.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate flex-1 mr-2">{i.name}</span>
                              <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">{i.pivot.quantity} {i.pivot.unit || i.unit}/dia</span>
                            </li>
                          ))}
                        </ul>
                        {rec.ingredients.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setExpandedRecipes(prev => {
                              const next = new Set(prev);
                              if (next.has(rec.id)) next.delete(rec.id); else next.add(rec.id);
                              return next;
                            })}
                            className="mt-2 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                          >
                            {expandedRecipes.has(rec.id)
                              ? <><ChevronUp className="w-3 h-3" /> Recolher</>
                              : <><ChevronDown className="w-3 h-3" /> +{rec.ingredients.length - 3} mais</>
                            }
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {recipes?.filter(r => r.is_template && (adminRecSearch ? r.name.toLowerCase().includes(adminRecSearch.toLowerCase()) : true) && (adminRecPetFilter !== "all" ? r.pet_type === adminRecPetFilter : true)).length === 0 && (
                <div className="col-span-3 p-12 text-center text-muted-foreground border rounded-lg border-dashed">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p>{t("no_recipes")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg bg-card">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium rounded-tl-lg">{t("name")}</th>
                    <th className="px-6 py-3 font-medium text-center">{tRec("pet_type")}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("duration")}</th>
                    <th className="px-6 py-3 font-medium text-center">{tRec("portions_per_day_caps")}</th>
                    <th className="px-6 py-3 font-medium text-center">{tRec("ingredients")}</th>
                    <th className="px-6 py-3 font-medium text-right">{t("base_price_table_header")}</th>
                    <th className="px-6 py-3 font-medium text-right rounded-tr-lg">{tCommon("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recipes?.filter(r => {
                    if (!r.is_template) return false;
                    if (adminRecSearch && !r.name.toLowerCase().includes(adminRecSearch.toLowerCase())) return false;
                    if (adminRecPetFilter !== "all" && r.pet_type !== adminRecPetFilter) return false;
                    return true;
                  }).map(rec => (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{rec.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] mt-0.5">{rec.description}</div>
                      </td>
                      <td className="px-6 py-4 text-center">{rec.pet_type === 'cat' ? 'Gato' : rec.pet_type === 'dog' ? 'Cachorro' : 'Geral'}</td>
                      <td className="px-6 py-4 text-center">{rec.duration_days} dias</td>
                      <td className="px-6 py-4 text-center">{rec.daily_portions}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-flex group/ing cursor-default">
                          <span className="underline decoration-dotted decoration-muted-foreground/50">
                            {rec.ingredients?.length ?? 0}
                          </span>
                          {(rec.ingredients?.length ?? 0) > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover/ing:block pointer-events-none">
                              <div className="bg-popover border border-border shadow-lg rounded-lg p-2.5 text-left min-w-[180px] max-w-[260px]">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 border-b pb-1">{tRec("ingredients")}</p>
                                <ul className="space-y-1">
                                  {rec.ingredients?.map(i => (
                                    <li key={i.id} className="flex items-center gap-1.5 text-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                      <span className="text-foreground truncate flex-1">{i.name}</span>
                                      <span className="text-muted-foreground text-[10px] shrink-0 ml-1">{String(parseFloat(i.pivot.quantity) || 0)}{i.pivot.unit || i.unit}/d</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="w-2.5 h-2.5 bg-popover border-b border-r border-border rotate-45 mx-auto -mt-[5px]" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-amber-600 dark:text-amber-400">R$ {Number(rec.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRecModal(rec, "template")}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ingredient Modal */}
      <Modal isOpen={isIngModalOpen} onClose={() => setIsIngModalOpen(false)} title={editingIng ? t("edit_ingredient") : t("new_ingredient")}>
        <form onSubmit={handleIngSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("name")}</Label>
              <Input
                value={ingForm.name}
                onChange={e => { setIngForm({...ingForm, name: e.target.value}); setIngFormErrors(p => ({...p, name: ""})); }}
                className={ingFormErrors.name ? "border-destructive" : ""}
              />
              {ingFormErrors.name && <p className="text-xs text-destructive">{ingFormErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("category")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ingForm.category} onChange={e => setIngForm({...ingForm, category: e.target.value})}>
                <option value="Proteína">{t("protein")}</option>
                <option value="Carboidrato">{t("carb")}</option>
                <option value="Vegetal">{t("vegetable")}</option>
                <option value="Gordura">{t("fat")}</option>
                <option value="Suplemento">{t("supplement")}</option>
                <option value="Outro">{t("other")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("unit")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})}>
                <option value="kg">{t("unit_kg")}</option>
                <option value="g">{t("unit_g")}</option>
                <option value="l">{t("unit_l")}</option>
                <option value="ml">{t("unit_ml")}</option>
                <option value="unit">{t("unit_un")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("base_price_label")}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyMask(ingForm.cost_per_unit)}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setIngForm({...ingForm, cost_per_unit: digits});
                  setIngFormErrors(p => ({...p, cost_per_unit: ""}));
                }}
                className={ingFormErrors.cost_per_unit ? "border-destructive" : ""}
              />
              {ingFormErrors.cost_per_unit && <p className="text-xs text-destructive">{ingFormErrors.cost_per_unit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("loss_rate_label")}</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={ingForm.loss_rate}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*/, "$1");
                  setIngForm({...ingForm, loss_rate: v});
                  setIngFormErrors(p => ({...p, loss_rate: ""}));
                }}
                onBlur={() => {
                  const n = parseFloat(ingForm.loss_rate);
                  if (!isNaN(n)) setIngForm(f => ({...f, loss_rate: n.toFixed(2)}));
                }}
                className={ingFormErrors.loss_rate ? "border-destructive" : ""}
              />
              {ingFormErrors.loss_rate && <p className="text-xs text-destructive">{ingFormErrors.loss_rate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("difficulty_multiplier_label")}</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={ingForm.difficulty_multiplier}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d*).*/, "$1");
                  setIngForm({...ingForm, difficulty_multiplier: v});
                  setIngFormErrors(p => ({...p, difficulty_multiplier: ""}));
                }}
                onBlur={() => {
                  const n = parseFloat(ingForm.difficulty_multiplier);
                  if (!isNaN(n)) setIngForm(f => ({...f, difficulty_multiplier: n.toFixed(2)}));
                }}
                className={ingFormErrors.difficulty_multiplier ? "border-destructive" : ""}
              />
              {ingFormErrors.difficulty_multiplier && <p className="text-xs text-destructive">{ingFormErrors.difficulty_multiplier}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsIngModalOpen(false); setIngFormErrors({}); }}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={isCreatingIng || isUpdatingIng}>
              {(isCreatingIng || isUpdatingIng) && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Recipe Modal */}
      <Modal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} title={editingRec ? t("edit_recipe") : t("new_recipe")} className="max-w-4xl">
        <form onSubmit={handleRecSubmit} className="space-y-6 px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("recipe_name")}</Label>
              <Input
                value={recForm.name}
                onChange={e => { setRecForm({...recForm, name: e.target.value}); setRecFormErrors(p => ({...p, name: ""})); }}
                className={recFormErrors.name ? "border-destructive" : ""}
              />
              {recFormErrors.name && <p className="text-xs text-destructive">{recFormErrors.name}</p>}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>{t("pet_type")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => {
                    const current = recForm.pet_type;
                    const isCat = current === "cat" || current === "both";
                    const isDog = current === "dog" || current === "both";
                    
                    const newIsDog = !isDog;
                    let next = "";
                    if (newIsDog && isCat) next = "both";
                    else if (newIsDog && !isCat) next = "dog";
                    else if (!newIsDog && isCat) next = "cat";
                    
                    if (next !== "") {
                      setRecForm({...recForm, pet_type: next});
                      setRecFormErrors(p => ({...p, pet_type: ""}));
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all", 
                    (recForm.pet_type === "dog" || recForm.pet_type === "both") 
                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                      : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                  )}
                >
                  <Dog className={cn("w-5 h-5", (recForm.pet_type === "dog" || recForm.pet_type === "both") ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-semibold">{t("dog")}</span>
                </div>
                
                <div 
                  onClick={() => {
                    const current = recForm.pet_type;
                    const isCat = current === "cat" || current === "both";
                    const isDog = current === "dog" || current === "both";
                    
                    const newIsCat = !isCat;
                    let next = "";
                    if (newIsCat && isDog) next = "both";
                    else if (newIsCat && !isDog) next = "cat";
                    else if (!newIsCat && isDog) next = "dog";
                    
                    if (next !== "") {
                      setRecForm({...recForm, pet_type: next});
                      setRecFormErrors(p => ({...p, pet_type: ""}));
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all", 
                    (recForm.pet_type === "cat" || recForm.pet_type === "both") 
                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                      : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                  )}
                >
                  <Cat className={cn("w-5 h-5", (recForm.pet_type === "cat" || recForm.pet_type === "both") ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-semibold">{t("cat")}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label>{t("description_label")}</Label>
            <Input
              value={recForm.description}
              onChange={e => { setRecForm({...recForm, description: e.target.value}); setRecFormErrors(p => ({...p, description: ""})); }}
              className={recFormErrors.description ? "border-destructive" : ""}
            />
            {recFormErrors.description && <p className="text-xs text-destructive">{recFormErrors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("instructions")}</Label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={recForm.instructions} 
              onChange={e => setRecForm({...recForm, instructions: e.target.value})} 
            />
          </div>
          
          {/* Ingredient picker — visual grid, same pattern as customer builder */}
          <div className="space-y-3">
            <Label>{t("ingredients")}</Label>
            <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-2.5 rounded-lg flex gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span><strong>{tCommon("error") === "Erro!" ? "Importante:" : tCommon("error") === "Error!" ? "Important:" : "Importante:"}</strong> {tRec("important_daily_qty")}</span>
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
                value={adminRecCategoryFilter}
                onChange={(e) => setAdminRecCategoryFilter(e.target.value)}
                className="h-9 px-2 border rounded-md text-sm bg-background border-input w-36"
              >
                <option value="Todos">Todos</option>
                {Array.from(new Set(ingredients?.map(i => i.category).filter(Boolean))).map(cat => (
                  <option key={cat as string} value={cat as string}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Clickable ingredient grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1 border rounded-md p-2 bg-muted/20">
              {ingredients?.filter(ing => {
                const matchSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                const matchCategory = adminRecCategoryFilter === "Todos" || ing.category === adminRecCategoryFilter;
                return matchSearch && matchCategory;
              }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map(ing => {
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
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{ing.category || "Geral"}</span>
                    </div>
                  </div>
                );
              })}
              {ingredients?.filter(ing => {
                const matchSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase());
                const matchCategory = adminRecCategoryFilter === "Todos" || ing.category === adminRecCategoryFilter;
                return matchSearch && matchCategory;
              }).length === 0 && (
                <div className="col-span-4 text-center text-xs text-muted-foreground py-4">{t("no_ingredients_found")}</div>
              )}
            </div>

            {/* Selected ingredients with quantities */}
            {recipeIngredients.length > 0 ? (
              <div className="border rounded-md p-3 bg-card space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1.5 border-b">Ingredientes selecionados — qtd/dia</p>
                {(() => {
                  const ingCostMap = new Map(
                    costBreakdown.filter(i => !i.is_supplement).map(i => [i.name, i])
                  );
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
            {recFormErrors.ingredients && (
              <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {recFormErrors.ingredients}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("duration")} ({t("days")})</Label>
              <Input
                type="number"
                value={recForm.duration_days}
                onChange={e => { setRecForm({...recForm, duration_days: e.target.value}); setRecFormErrors(p => ({...p, duration_days: ""})); }}
                className={recFormErrors.duration_days ? "border-destructive" : ""}
              />
              {recFormErrors.duration_days && <p className="text-xs text-destructive">{recFormErrors.duration_days}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t("daily_portions")}</Label>
              <Input
                type="number"
                value={recForm.daily_portions}
                onChange={e => { setRecForm({...recForm, daily_portions: e.target.value}); setRecFormErrors(p => ({...p, daily_portions: ""})); }}
                className={recFormErrors.daily_portions ? "border-destructive" : ""}
              />
              {recFormErrors.daily_portions && <p className="text-xs text-destructive">{recFormErrors.daily_portions}</p>}
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
                {recCostPerKg > 0 && (
                  <div className="text-xs text-muted-foreground">R$ {recCostPerKg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg</div>
                )}
                {costBreakdown.filter(i => !i.is_supplement).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-primary/20">
                    Custo base: R$ {costBreakdown.filter(i => !i.is_supplement).reduce((s: number, i: any) => s + Number(i.total_cost), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Ver detalhamento da receita</span>
                {recipeDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {recipeDetailOpen && (
                <div className="py-3 space-y-3 border-b border-primary/10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{tRec("total_duration")}</span>
                    <span className="font-semibold">{recForm.duration_days} {t("days")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{tRec("daily_portions_label")}</span>
                    <span className="font-semibold">{recForm.daily_portions} {tRec("portions_per_day_plural")}</span>
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
                          const portions = Number(recForm.daily_portions) || 1;
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
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Ver detalhamento dos custos</span>
                {costDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {costDetailOpen && (
                costBreakdown.filter(i => i.is_supplement).length > 0 ? (
                  <ul className="space-y-1 text-xs mt-3">
                    {costBreakdown.filter(i => !i.is_supplement).length > 0 && (
                      <li className="flex justify-between pb-1.5 mb-0.5 border-b-2 border-primary/30 font-semibold text-foreground text-xs">
                        <span>{tRec("base_cost")} ({tRec("ingredients").toLowerCase()})</span>
                        <span>R$ {costBreakdown.filter(i => !i.is_supplement).reduce((s: number, i: any) => s + Number(i.total_cost), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </li>
                    )}
                    {[...costBreakdown.filter(i => i.is_supplement)]
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
            <Button type="button" variant="outline" onClick={() => setIsRecModalOpen(false)}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={isCreatingRec || isUpdatingRec || isCalculatingCost}>{t("save_model")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
