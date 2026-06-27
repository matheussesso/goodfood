"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useIngredients, Ingredient } from "@/hooks/useIngredients";
import { useRecipes, Recipe } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Trash2, Loader2, BookOpen, Apple, Settings2, Save, AlertCircle } from "lucide-react";
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
  const { calculateRecipeCost } = require("@/hooks/useRecipes");

  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Recipe | null>(null);
  const [recForm, setRecForm] = useState({
    name: "", description: "", pet_type: "dog", duration_days: "15", daily_portions: "2", is_active: true, instructions: ""
  });
  const [recipeIngredients, setRecipeIngredients] = useState<{id: number, quantity: string, unit: string}[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");

  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);

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
          setCostBreakdown(result.costBreakdown || []);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCalculatingCost(false);
        }
      } else {
        setEstimatedCost(0);
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
  const handleOpenRecModal = (rec?: Recipe) => {
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
      is_template: true, is_active: recForm.is_active,
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
              <div className="divide-y border rounded-md">
                {ingredients?.map(ing => (
                  <div key={ing.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <h4 className="font-medium">{ing.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("cost")}: R$ {ing.cost_per_unit} / {ing.unit} | 
                        {t("loss")}: {ing.loss_rate}% | 
                        {t("difficulty")}: x{ing.difficulty_multiplier}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenIngModal(ing)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteIng(ing.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
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
                      <div>
                        <CardTitle className="text-lg">{rec.name}</CardTitle>
                        <CardDescription>
                          {t("duration")}: {rec.duration_days} {t("days")} | 
                          {t("base_cost")}: R$ {rec.base_cost}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRecModal(rec)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm font-medium mb-2">{t("composition")}</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {rec.ingredients?.map(i => (
                          <li key={i.id}>{i.name}: {i.pivot.quantity} {i.pivot.unit || i.unit}</li>
                        ))}
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
              <Label>{t("unit")}</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})}>
                <option value="kg">{t("kg")}</option>
                <option value="g">{t("g")}</option>
                <option value="l">{t("l")}</option>
                <option value="unit">{t("un")}</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Preço / {ingForm.unit}</Label><Input type="number" step="0.01" required value={ingForm.cost_per_unit} onChange={e => setIngForm({...ingForm, cost_per_unit: e.target.value})} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t("loss_rate")}</Label><Input type="number" step="0.1" value={ingForm.loss_rate} onChange={e => setIngForm({...ingForm, loss_rate: e.target.value})} /></div>
            <div className="space-y-2"><Label>{t("difficulty_multiplier")}</Label><Input type="number" step="0.1" value={ingForm.difficulty_multiplier} onChange={e => setIngForm({...ingForm, difficulty_multiplier: e.target.value})} /></div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsIngModalOpen(false)}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={isCreatingIng || isUpdatingIng}>{tCommon("save")}</Button>
          </div>
        </form>
      </Modal>

      {/* Recipe Modal */}
      <Modal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} title={editingRec ? t("edit_recipe") : t("new_recipe")} className="max-w-4xl">
        <form onSubmit={handleRecSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-2">
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>{t("ingredients")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setRecipeIngredients([...recipeIngredients, {id: 0, quantity: "", unit: "kg"}])}>
                  <Plus className="h-3 w-3 mr-1" /> {tCommon("add")}
                </Button>
              </div>
              <div className="mb-2">
                <Input 
                  placeholder={t("search_ingredient")} 
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="border rounded-md p-3 space-y-3 bg-muted/30 max-h-[300px] overflow-y-auto">
                {recipeIngredients.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2">
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs flex-1 min-w-[120px]"
                      value={item.id} onChange={e => {
                        const newArr = [...recipeIngredients]; newArr[idx].id = parseInt(e.target.value); setRecipeIngredients(newArr);
                      }}
                    >
                      <option value={0} disabled>{tCommon("select")}</option>
                      {ingredients?.filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())).map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                    </select>
                    <Input type="number" step="0.001" placeholder="Qtd" className="w-20 h-9 px-2 text-xs" value={item.quantity} onChange={e => {
                      const newArr = [...recipeIngredients]; newArr[idx].quantity = e.target.value; setRecipeIngredients(newArr);
                    }} />
                    <select
                      className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={item.unit} onChange={e => {
                        const newArr = [...recipeIngredients]; newArr[idx].unit = e.target.value; setRecipeIngredients(newArr);
                      }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="unit">un</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {recipeIngredients.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">{t("no_ingredients")}</p>}
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>{t("estimated_cost")}</Label>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Total Estimado</span>
                  <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                    {isCalculatingCost && <Loader2 className="w-4 h-4 animate-spin" />}
                    R$ {estimatedCost.toFixed(2)}
                  </div>
                </div>

                <div className="text-sm space-y-2 border-t border-primary/20 pt-4">
                  <p className="font-medium text-foreground">{t("cost_breakdown")}</p>
                  <ul className="space-y-1.5 text-muted-foreground text-xs">
                    {costBreakdown?.filter(item => item.is_supplement).map((item, idx) => (
                      <li key={idx} className="flex justify-between border-b border-primary/10 pb-1">
                        <span>{item.name}</span>
                        <span>R$ {Number(item.total_cost).toFixed(2)}</span>
                      </li>
                    ))}
                    {(!costBreakdown || costBreakdown.length === 0) && (
                      <li className="text-center italic py-2">
                        {t("add_ingredients_simulate")}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
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
