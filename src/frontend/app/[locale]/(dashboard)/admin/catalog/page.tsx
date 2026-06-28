"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useIngredients, Ingredient } from "@/hooks/useIngredients";
import { useRecipes, Recipe, calculateRecipeCost } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Trash2, Loader2, BookOpen, Apple, Settings2, Save, AlertCircle, Search, Filter, LayoutGrid, List, CheckCircle2, Check, Info, ChevronDown, ChevronUp, DollarSign, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, GeneralSettings } from "@/hooks/useSettings";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export default function CatalogPage() {
  const tNav = useTranslations("Navigation");
  const t = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"ingredients" | "recipes" | "settings">("ingredients");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Settings Hooks & State
  const { settings, isLoading: isLoadingSettings, updateSettings, isUpdating: isUpdatingSettings } = useSettings();
  const { register: registerSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings, formState: { errors: settingsErrors } } = useForm<GeneralSettings>();

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
      title: "Repasse Produção",
      fields: [
        { name: "production_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "production_days_division", label: "Divisão Dias", type: "number", step: "1" },
        { name: "production_weight_multiplier", label: "Multiplicador Peso", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Repasse Logística",
      fields: [
        { name: "logistics_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Margem Reserva",
      fields: [
        { name: "reserve_margin_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "reserve_margin_transfer_multiplier", label: "Multiplicador Repasse", type: "number", step: "0.001" },
      ]
    },
    {
      title: "GFP + MKT",
      fields: [
        { name: "gfp_mkt_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "gfp_mkt_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Fiscal / Tributário",
      fields: [
        { name: "fiscal_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Cobrar",
      fields: [
        { name: "charge_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "charge_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Agenda",
      fields: [
        { name: "schedule_fixed_value", label: "Valor Fixo", type: "number", step: "0.01" },
        { name: "schedule_fixed_multiplier", label: "Multiplicador Fixo", type: "number", step: "0.001" },
      ]
    },
    {
      title: "Dificuldade & Insumos",
      fields: [
        { name: "difficulty_fixed_value", label: "Dificuldade Valor Fixo", type: "number", step: "0.01" },
        { name: "ingredient_cost_days_division", label: "Custo Insumos Divisão Dias", type: "number", step: "1" },
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

  const [adminRecCategoryFilter, setAdminRecCategoryFilter] = useState("Todos");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [recCostPerKg, setRecCostPerKg] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [costDetailOpen, setCostDetailOpen] = useState(false);

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
        cost_per_unit: ing.cost_per_unit.toString(), loss_rate: ing.loss_rate.toString(), 
        difficulty_multiplier: ing.difficulty_multiplier.toString(), is_active: ing.is_active
      });
    } else {
      setEditingIng(null);
      setIngForm({ name: "", category: "Outro", description: "", unit: "kg", cost_per_unit: "", loss_rate: "0", difficulty_multiplier: "1.0", is_active: true });
    }
    setIsIngModalOpen(true);
  };

  const handleIngSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: ingForm.name, category: ingForm.category, description: ingForm.description, unit: ingForm.unit,
      cost_per_unit: parseFloat(ingForm.cost_per_unit), loss_rate: parseFloat(ingForm.loss_rate),
      difficulty_multiplier: parseFloat(ingForm.difficulty_multiplier), is_active: ingForm.is_active
    };

    if (editingIng) await updateIngredient({ id: editingIng.id, ...data });
    else await createIngredient(data);
    
    setIsIngModalOpen(false);
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
    setIsEditingTemplate(type === "template");
    if (rec) {
      setEditingRec(rec);
      setRecForm({
        name: rec.name, description: rec.description || "", instructions: rec.instructions || "",
        pet_type: rec.pet_type || "dog", duration_days: rec.duration_days?.toString() || "15",
        daily_portions: rec.daily_portions?.toString() || "2", is_active: rec.is_active
      });
      setRecipeIngredients(rec.ingredients.map(i => ({ id: i.id, quantity: i.pivot.quantity, unit: i.pivot.unit || i.unit })));
    } else {
      setEditingRec(null);
      setRecForm({ name: "", description: "", instructions: "", pet_type: "dog", duration_days: "15", daily_portions: "2", is_active: true });
      setRecipeIngredients([]);
    }
    setIsRecModalOpen(true);
  };

  const handleRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: recForm.name, description: recForm.description,
      pet_type: recForm.pet_type, duration_days: parseInt(recForm.duration_days), daily_portions: parseInt(recForm.daily_portions),
      is_template: isEditingTemplate, is_active: recForm.is_active, instructions: recForm.instructions,
      ingredients: recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).map(i => ({ id: i.id, quantity: parseFloat(i.quantity), unit: i.unit }))
    };

    if (editingRec) await updateRecipe({ id: editingRec.id, ...data });
    else await createRecipe(data);

    setIsRecModalOpen(false);
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
        <Card>
          <CardHeader>
            <CardTitle>{t("settings_title")}</CardTitle>
            <CardDescription>
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-3 flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t("settings_warning")}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSettings ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <form onSubmit={handleSettingsSubmit(onSettingsSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {settingsSections.map((section, idx) => (
                    <div key={idx} className="bg-card border rounded-xl p-4 shadow-sm">
                      <h3 className="text-md font-semibold mb-3 text-primary border-b pb-1">
                        {section.title}
                      </h3>
                      <div className="space-y-3">
                        {section.fields.map((field) => (
                          <div key={field.name}>
                            <label className="block text-xs font-medium text-foreground mb-1">
                              {field.label}
                            </label>
                            <input
                              type={field.type}
                              step={field.step}
                              {...registerSettings(field.name as keyof GeneralSettings, { valueAsNumber: true })}
                              className="w-full px-2 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            {settingsErrors[field.name as keyof GeneralSettings] && (
                              <span className="text-xs text-destructive mt-1">Inválido</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={isUpdatingSettings}>
                    {isUpdatingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {t("save_settings")}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "ingredients" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("ingredients")}</CardTitle>
              <CardDescription>{t("ingredients_desc")}</CardDescription>
            </div>
            <Button onClick={() => handleOpenIngModal()}><Plus className="h-4 w-4 mr-2" /> {t("new_ingredient")}</Button>
          </CardHeader>
          <CardContent>
            {isLoadingIng ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar ingrediente..." 
                      className="pl-9"
                      value={adminIngSearch}
                      onChange={e => setAdminIngSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={adminIngCategory}
                      onChange={e => setAdminIngCategory(e.target.value)}
                    >
                      <option value="all">Todas as Categorias</option>
                      <option value="Proteína">Proteína</option>
                      <option value="Carboidrato">Carboidrato</option>
                      <option value="Vegetal">Vegetal</option>
                      <option value="Gordura">Gordura</option>
                      <option value="Suplemento">Suplemento</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <div className="flex items-center border rounded-md p-1 bg-muted/30 ml-2">
                      <Button 
                        variant={viewMode === "grid" ? "secondary" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => setViewMode("grid")}
                        title="Visualização em Cards"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={viewMode === "list" ? "secondary" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => setViewMode("list")}
                        title="Visualização em Lista"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-2"}>
                  {ingredients?.filter(ing => {
                    if (adminIngCategory !== "all" && ing.category !== adminIngCategory) return false;
                    if (adminIngSearch && !ing.name.toLowerCase().includes(adminIngSearch.toLowerCase())) return false;
                    return true;
                  }).map(ing => (
                    viewMode === "grid" ? (
                      <Card key={ing.id} className="relative group hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur-sm rounded-md p-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenIngModal(ing)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteIng(ing.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="p-4 border-b bg-muted/10">
                          <h4 className="font-semibold text-sm line-clamp-1 pr-12 mb-1" title={ing.name}>{ing.name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            {ing.category || 'Sem Categoria'}
                          </span>
                        </div>
                        <div className="p-4 text-sm flex-1 flex flex-col justify-center space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Preço:</span>
                            <span className="font-semibold text-primary">R$ {ing.cost_per_unit} <span className="text-xs text-muted-foreground font-normal">/ {ing.unit === 'g' || ing.unit === 'kg' ? 'kg' : ing.unit === 'l' ? 'L' : 'un'}</span></span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Perda:</span>
                            <span className="font-medium">{ing.loss_rate}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Dificuldade:</span>
                            <span className="font-medium">x{ing.difficulty_multiplier}</span>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div key={ing.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors group bg-card">
                        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-12 sm:col-span-5 lg:col-span-4">
                            <h4 className="font-semibold text-sm line-clamp-1 mb-0.5" title={ing.name}>{ing.name}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                              {ing.category || 'Sem Categoria'}
                            </span>
                          </div>
                          <div className="hidden sm:flex col-span-3 lg:col-span-3 flex-col text-sm">
                            <span className="text-muted-foreground text-[10px] uppercase">Preço</span>
                            <span className="font-medium text-primary">R$ {ing.cost_per_unit} <span className="text-xs text-muted-foreground font-normal">/ {ing.unit === 'g' || ing.unit === 'kg' ? 'kg' : ing.unit === 'l' ? 'L' : 'un'}</span></span>
                          </div>
                          <div className="hidden lg:flex col-span-2 flex-col text-sm">
                            <span className="text-muted-foreground text-[10px] uppercase">Perda</span>
                            <span className="font-medium">{ing.loss_rate}%</span>
                          </div>
                          <div className="hidden lg:flex col-span-2 flex-col text-sm">
                            <span className="text-muted-foreground text-[10px] uppercase">Dificuldade</span>
                            <span className="font-medium">x{ing.difficulty_multiplier}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenIngModal(ing)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteIng(ing.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {ingredients?.length === 0 && <div className="p-8 text-center text-muted-foreground">{t("no_ingredients")}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "recipes" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("recipes")}</CardTitle>
              <CardDescription>{t("recipes_desc")}</CardDescription>
            </div>
            <Button onClick={() => handleOpenRecModal()}><Plus className="h-4 w-4 mr-2" /> {t("new_recipe")}</Button>
          </CardHeader>
          <CardContent>
            {isLoadingRec ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <div className="grid gap-4 md:grid-cols-2">
                {recipes?.filter(r => r.is_template).map(rec => (
                  <Card key={rec.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                    <CardHeader className="p-4 flex flex-row items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{rec.name}</CardTitle>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{t("duration")}: <strong className="text-foreground">{rec.duration_days} {t("days")}</strong></span>
                          <span>{rec.daily_portions} porções/dia</span>
                          <span className="text-primary font-semibold">R$ {Number(rec.base_cost).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRecModal(rec, "template")}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("composition")}</p>
                      <ul className="space-y-1 text-sm">
                        {rec.ingredients?.map(i => {
                          const qty = parseFloat(i.pivot.quantity);
                          const unit = i.pivot.unit || i.unit;
                          const costPerDay = (i.cost_per_unit ?? 0) * qty * (i.loss_rate ?? 1);
                          const totalCost = costPerDay * (rec.duration_days ?? 15);
                          return (
                            <li key={i.id} className="flex justify-between items-center text-muted-foreground border-b border-border/30 pb-1 last:border-0">
                              <span className="truncate flex-1 mr-2">{i.name} <span className="text-xs opacity-70">{qty} {unit}/dia</span></span>
                              <span className="shrink-0 text-xs font-medium text-foreground">R$ {totalCost.toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
                {recipes?.filter(r => r.is_template).length === 0 && (
                  <div className="col-span-2 p-8 text-center text-muted-foreground border rounded-md">
                    {t("no_recipes")}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ingredient Modal */}
      <Modal isOpen={isIngModalOpen} onClose={() => setIsIngModalOpen(false)} title={editingIng ? t("edit_ingredient") : t("new_ingredient")}>
        <form onSubmit={handleIngSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("name")}</Label><Input required value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ingForm.category} onChange={e => setIngForm({...ingForm, category: e.target.value})}>
                <option value="Proteína">{t("protein")}</option>
                <option value="Carboidrato">{t("carb")}</option>
                <option value="Vegetal">{t("vegetable")}</option>
                <option value="Suplemento">{t("supplement")}</option>
                <option value="Outro">{t("other")}</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidade de Compra</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})}>
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="l">Litro (L)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="unit">Unidade (un)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Preço Base (por kg, L ou Unidade)</Label>
              <Input type="number" step="0.01" required value={ingForm.cost_per_unit} onChange={e => setIngForm({...ingForm, cost_per_unit: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa de Perda (%)</Label>
              <Input type="number" step="0.01" required value={ingForm.loss_rate} onChange={e => setIngForm({...ingForm, loss_rate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Multiplicador de Dificuldade</Label>
              <Input type="number" step="0.01" required value={ingForm.difficulty_multiplier} onChange={e => setIngForm({...ingForm, difficulty_multiplier: e.target.value})} />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsIngModalOpen(false)}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={isCreatingIng || isUpdatingIng}>{tCommon("save")}</Button>
          </div>
        </form>
      </Modal>

      {/* Recipe Modal */}
      <Modal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} title={editingRec ? t("edit_recipe") : t("new_recipe")} className="max-w-4xl">
        <form onSubmit={handleRecSubmit} className="space-y-6 px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("recipe_name")}</Label><Input required value={recForm.name} onChange={e => setRecForm({...recForm, name: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>{t("pet_type")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={recForm.pet_type} onChange={e => setRecForm({...recForm, pet_type: e.target.value})}>
                <option value="dog">{t("dog")}</option>
                <option value="cat">{t("cat")}</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("duration")} ({t("days")})</Label><Input type="number" required value={recForm.duration_days} onChange={e => setRecForm({...recForm, duration_days: e.target.value})} /></div>
            <div className="space-y-2"><Label>{t("daily_portions")}</Label><Input type="number" required value={recForm.daily_portions} onChange={e => setRecForm({...recForm, daily_portions: e.target.value})} /></div>
          </div>

          <div className="space-y-2"><Label>{t("description_label")}</Label><Input value={recForm.description} onChange={e => setRecForm({...recForm, description: e.target.value})} /></div>
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
              <span><strong>Importante:</strong> As quantidades são por dia (quantidade diária por porção).</span>
            </div>

            {/* Search + category filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar ingrediente..."
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
              }).map(ing => {
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
                <div className="col-span-4 text-center text-xs text-muted-foreground py-4">Nenhum ingrediente encontrado</div>
              )}
            </div>

            {/* Selected ingredients with quantities */}
            {recipeIngredients.length > 0 ? (
              <div className="space-y-2 border rounded-md p-3 bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ingredientes selecionados — qtd/dia</p>
                {(() => {
                  const ingCostMap = new Map(
                    costBreakdown.filter(i => !i.is_supplement).map(i => [i.name, i])
                  );
                  return recipeIngredients.map((item, idx) => {
                    const ing = ingredients?.find(i => i.id === item.id);
                    const breakdown = ing ? ingCostMap.get(ing.name) : null;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="flex-1 text-sm font-medium truncate min-w-0">{ing?.name || "?"}</span>
                        {breakdown && (
                          <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                            R$ {Number(breakdown.total_cost).toFixed(2)}
                          </span>
                        )}
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Qtd/dia"
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
              <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">{t("no_ingredients")}</p>
            )}
          </div>

          {/* Admin cost breakdown — full detail with accordions */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                {t("estimated_cost")}
                {isCalculatingCost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">R$ {estimatedCost.toFixed(2)}</div>
                {recCostPerKg > 0 && (
                  <div className="text-xs text-muted-foreground">R$ {recCostPerKg.toFixed(2)}/kg</div>
                )}
                {costBreakdown.filter(i => !i.is_supplement).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-primary/20">
                    Custo base: R$ {costBreakdown.filter(i => !i.is_supplement).reduce((s: number, i: any) => s + Number(i.total_cost), 0).toFixed(2)}
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
                    <span className="text-muted-foreground">Duração total:</span>
                    <span className="font-semibold">{recForm.duration_days} dias</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Porções diárias:</span>
                    <span className="font-semibold">{recForm.daily_portions} porção(ões)</span>
                  </div>
                  {recipeIngredients.filter(i => i.id > 0 && parseFloat(i.quantity) > 0).length > 0 && (
                    <div>
                      <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                        <span>Ingrediente</span>
                        <span className="text-right">Total/dia</span>
                        <span className="text-right">Por porção</span>
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
                        <span>Custo Base (ingredientes)</span>
                        <span>R$ {costBreakdown.filter(i => !i.is_supplement).reduce((s: number, i: any) => s + Number(i.total_cost), 0).toFixed(2)}</span>
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
                            <span>{item.name}</span>
                            <span>R$ {Number(item.total_cost).toFixed(2)}</span>
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
