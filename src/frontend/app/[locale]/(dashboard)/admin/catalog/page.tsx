"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useIngredients, Ingredient } from "@/hooks/useIngredients";
import { useRecipes, Recipe } from "@/hooks/useRecipes";
import { SettingsTab } from "@/features/admin-catalog/components/SettingsTab";
import { IngredientFormModal } from "@/features/admin-catalog/components/IngredientFormModal";
import { TemplateRecipeModal } from "@/features/admin-catalog/components/TemplateRecipeModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Loader2, BookOpen, Apple, Settings2, AlertCircle, Search, LayoutGrid, List, CheckCircle2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Feedback = { type: "success" | "error"; message: string } | null;

/**
 * Admin catalog page: ingredients, template recipes and pricing settings
 * tabs. Forms live in features/admin-catalog/components; this page keeps
 * the listings, filters and modal orchestration.
 */
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

  const [activeTab, setActiveTab] = useState<"ingredients" | "recipes" | "settings">("ingredients");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Ingredients hooks & listing state
  const { ingredients, isLoading: isLoadingIng, deleteIngredient } = useIngredients();
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [adminIngSearch, setAdminIngSearch] = useState("");
  const [adminIngCategory, setAdminIngCategory] = useState("all");
  const [adminIngSort, setAdminIngSort] = useState<"name" | "category" | "price">("name");
  const [adminIngPage, setAdminIngPage] = useState(1);
  const [ingFeedback, setIngFeedback] = useState<Feedback>(null);

  // Recipes hooks & listing state
  const { recipes, isLoading: isLoadingRec, deleteRecipe } = useRecipes();
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Recipe | null>(null);
  const [adminRecSearch, setAdminRecSearch] = useState("");
  const [adminRecPetFilter, setAdminRecPetFilter] = useState("all");
  const [recipesViewMode, setRecipesViewMode] = useState<"grid" | "list">("grid");
  const [recFeedback, setRecFeedback] = useState<Feedback>(null);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());

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

  // Keep the current page within range when filters shrink the result set
  // (derived clamp instead of a setState-in-effect reset).
  const currentIngPage = Math.min(adminIngPage, totalIngPages);

  const paginatedIng = useMemo(() => {
    const start = (currentIngPage - 1) * INGREDIENTS_PER_PAGE;
    return filteredSortedIng.slice(start, start + INGREDIENTS_PER_PAGE);
  }, [filteredSortedIng, currentIngPage, INGREDIENTS_PER_PAGE]);

  const filteredTemplates = useMemo(() =>
    (recipes ?? []).filter(r => {
      if (!r.is_template) return false;
      if (adminRecSearch && !r.name.toLowerCase().includes(adminRecSearch.toLowerCase())) return false;
      if (adminRecPetFilter !== "all" && r.pet_type !== adminRecPetFilter) return false;
      return true;
    }),
  [recipes, adminRecSearch, adminRecPetFilter]);

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-destructive">{tCommon("access_denied")}</div>;
  }

  const handleOpenIngModal = (ing?: Ingredient) => {
    setEditingIng(ing ?? null);
    setIsIngModalOpen(true);
  };

  const handleDeleteIng = async (id: number) => {
    if (confirm(tCommon("confirm_delete"))) await deleteIngredient(id);
  };

  const handleOpenRecModal = (rec?: Recipe) => {
    setEditingRec(rec ?? null);
    setIsRecModalOpen(true);
  };

  const handleDeleteRec = async (id: number) => {
    if (confirm(tCommon("confirm_delete"))) await deleteRecipe(id);
  };

  const showFeedback = (setter: (f: Feedback) => void, message: string) => {
    setter({ type: "success", message });
    setTimeout(() => setter(null), 4000);
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

      {activeTab === "settings" && <SettingsTab />}

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
                onChange={e => { setAdminIngSearch(e.target.value); setAdminIngPage(1); }}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
                value={adminIngCategory}
                onChange={e => { setAdminIngCategory(e.target.value); setAdminIngPage(1); }}
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
                onChange={e => { setAdminIngSort(e.target.value as "name" | "category" | "price"); setAdminIngPage(1); }}
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
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("loss")}</span>
                        <span className="font-medium text-xs">{ing.loss_rate}x</span>
                      </div>
                      <div className="px-2 py-2 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("difficulty")}</span>
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
                        <div className="text-xs text-muted-foreground mt-0.5">{translateCategory(ing.category)}</div>
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
                {t("page_info", { current: currentIngPage, total: totalIngPages })}
                {" · "}
                {filteredSortedIng.length} {filteredSortedIng.length === 1 ? t("ingredient") : t("ingredients")}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAdminIngPage(currentIngPage - 1)}
                  disabled={currentIngPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalIngPages) }, (_, i) => {
                  const page = totalIngPages <= 5
                    ? i + 1
                    : currentIngPage <= 3
                      ? i + 1
                      : currentIngPage >= totalIngPages - 2
                        ? totalIngPages - 4 + i
                        : currentIngPage - 2 + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentIngPage ? "default" : "outline"}
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
                  onClick={() => setAdminIngPage(currentIngPage + 1)}
                  disabled={currentIngPage === totalIngPages}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map(rec => (
                <div key={rec.id} className="group bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm leading-tight truncate" title={rec.name}>{rec.name}</h4>
                          <span className="text-[11px] text-muted-foreground truncate block">{rec.description || tRec("no_description")}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenRecModal(rec)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("pet_type")}</span>
                        <span className="font-medium text-xs truncate block">{rec.pet_type === 'cat' ? t("cat") : rec.pet_type === 'dog' ? t("dog") : t("general")}</span>
                      </div>
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("duration")}</span>
                        <span className="font-medium text-xs truncate block">{rec.duration_days}d</span>
                      </div>
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("portions_per_day_caps").split("/")[0]}</span>
                        <span className="font-medium text-xs truncate block">{rec.daily_portions}x</span>
                      </div>
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("estimated_cost")}</span>
                        <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">R$ {Number(rec.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {rec.ingredients && rec.ingredients.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-border/50">
                        <button
                          type="button"
                          onClick={() => setExpandedRecipes(prev => {
                            const next = new Set(prev);
                            if (next.has(rec.id)) next.delete(rec.id); else next.add(rec.id);
                            return next;
                          })}
                          className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                        >
                          <span>{tRec("recipe_composition")} ({rec.ingredients.length})</span>
                          {expandedRecipes.has(rec.id) ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                        </button>
                        {expandedRecipes.has(rec.id) && (
                          <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                            {rec.ingredients.map(i => (
                              <li key={i.id} className="flex items-center justify-between text-[11px] gap-2">
                                <span className="text-muted-foreground truncate flex-1">{i.name}</span>
                                <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">{i.pivot.quantity} {i.pivot.unit || i.unit}/{t("days").slice(0, 3)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredTemplates.length === 0 && (
                <div className="col-span-full p-12 text-center text-muted-foreground border rounded-lg border-dashed">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p>{t("no_recipes")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
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
                    {filteredTemplates.map(rec => (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold">{rec.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] mt-0.5">{rec.description}</div>
                        </td>
                        <td className="px-6 py-3.5 text-center">{rec.pet_type === 'cat' ? t("cat") : rec.pet_type === 'dog' ? t("dog") : t("general")}</td>
                        <td className="px-6 py-3.5 text-center">{rec.duration_days} {t("days")}</td>
                        <td className="px-6 py-3.5 text-center">{rec.daily_portions}</td>
                        <td className="px-6 py-3.5 text-center">
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
                        <td className="px-6 py-3.5 text-right font-semibold text-amber-600 dark:text-amber-400">R$ {Number(rec.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRecModal(rec)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals are mounted on demand so each opening re-seeds its form
          state from the freshest data (no effect-based syncing). */}
      {isIngModalOpen && (
        <IngredientFormModal
          ingredient={editingIng}
          isOpen
          onClose={() => setIsIngModalOpen(false)}
          onSaved={(message) => {
            setActiveTab("ingredients");
            showFeedback(setIngFeedback, message);
          }}
        />
      )}

      {isRecModalOpen && (
        <TemplateRecipeModal
          recipe={editingRec}
          isOpen
          onClose={() => setIsRecModalOpen(false)}
          onSaved={(message) => {
            setActiveTab("recipes");
            showFeedback(setRecFeedback, message);
          }}
        />
      )}
    </div>
  );
}
