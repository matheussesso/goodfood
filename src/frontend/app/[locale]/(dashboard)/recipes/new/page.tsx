"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { recipeFormSchema, RecipeFormData } from "@/lib/validations/recipe";
import { Ingredient } from "@/hooks/useIngredients";
import { calculateRecipeCost, Recipe } from "@/hooks/useRecipes";
import { usePets } from "@/hooks/usePets";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Plus, Trash2, UtensilsCrossed, FileText, CheckCircle2, Loader2, Info, Search, ChevronDown, ChevronUp, PartyPopper, Dog, Cat, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function NewRecipePage() {
  const t = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("pet_id");
  const queryClient = useQueryClient();
  const { pets } = usePets();

  const [step, setStep] = useState<"choose_method" | "builder">("choose_method");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [costPerKg, setCostPerKg] = useState<number>(0);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [searchIngredient, setSearchIngredient] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [focusedIngIdx, setFocusedIngIdx] = useState<number | null>(null);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [confirmedRecipeId, setConfirmedRecipeId] = useState<number | null>(null);

  // Fetch data
  const { data: ingredients, isLoading: loadingIngredients } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Ingredient[] }>("/ingredients");
      return response.data.data;
    },
  });

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["recipe_templates"],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Recipe[] }>("/recipes");
      return response.data.data.filter(r => r.is_template);
    },
  });

  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      pet_type: "dog",
      duration_days: 15,
      daily_portions: 2,
      instructions: "",
      is_template: false,
      pet_ids: petId ? [parseInt(petId)] : [],
      ingredients: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  });

  // useWatch subscribes via context instead of the unstable watch() getter,
  // which the React Compiler cannot memoize safely. The cast is sound: the
  // useForm defaultValues above cover every field on first render.
  const watchedValues = useWatch({ control }) as RecipeFormData;
  const { user } = useAuth();

  // Daily weight of valid ingredients in kg
  const validIngredients = useMemo(
    () => watchedValues.ingredients.filter(i => i.id > 0 && Number(i.quantity) > 0),
    [watchedValues.ingredients]
  );
  let totalWeightKg = 0;
  validIngredients.forEach(i => {
    const qty = Number(i.quantity);
    if (i.unit === "g" || i.unit === "ml") totalWeightKg += qty / 1000;
    else if (i.unit === "kg" || i.unit === "l") totalWeightKg += qty;
    else if (i.unit === "unit") totalWeightKg += qty * 0.1;
  });
  // Total weight across all days — matches old system: sum(daily_weight) * duration_days >= 1.5kg
  const totalWeightAcrossDays = totalWeightKg * (Number(watchedValues.duration_days) || 15);

  // Watch for cost calculation
  useEffect(() => {
    if (step !== "builder") return;

    const fetchCost = async () => {
      // Customer constraint: total weight across all days must be >= 1.5kg (matches old system: sum * duration_days >= 1500g)
      if (user?.role === "customer" && totalWeightAcrossDays < 1.5) {
        setEstimatedCost(0);
        return; // Don't fetch cost yet
      }

      if (validIngredients.length > 0) {
        setIsCalculatingCost(true);
        try {
          const result = await calculateRecipeCost({
            ingredients: validIngredients.map(i => ({ ingredient_id: i.id, quantity: Number(i.quantity), unit: i.unit })),
            duration_days: Number(watchedValues.duration_days) || 15,
            daily_portions: Number(watchedValues.daily_portions) || 2
          });
          setEstimatedCost(result.estimatedCost);
          setCostPerKg(result.costPerKg || 0);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCalculatingCost(false);
        }
      } else {
        setEstimatedCost(0);
        setCostPerKg(0);
      }
    };

    const timeoutId = setTimeout(fetchCost, 500);
    return () => clearTimeout(timeoutId);
  }, [validIngredients, watchedValues.duration_days, watchedValues.daily_portions, step, user?.role, totalWeightAcrossDays]);

  const createRecipe = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      const response = await apiClient.post("/recipes", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setConfirmedRecipeId(data?.data?.id ?? 0);
    }
  });

  const onSubmit = (data: RecipeFormData) => {
    const validData = {
      ...data,
      ingredients: data.ingredients.filter(i => i.id > 0 && Number(i.quantity) > 0).map(i => ({
        ...i,
        quantity: Number(i.quantity)
      }))
    };
    createRecipe.mutate(validData);
  };

  const handleSelectTemplate = (template: Recipe) => {
    setValue("name", template.name + t("copy_suffix"));
    setValue("description", template.description || "");
    setValue("pet_type", template.pet_type || "dog");
    setValue("duration_days", template.duration_days || 15);
    setValue("daily_portions", template.daily_portions || 2);
    setValue("instructions", template.instructions || "");
    setValue("ingredients", template.ingredients.map(i => ({
      id: i.id,
      quantity: Number(i.pivot.quantity),
      unit: i.pivot.unit || i.unit
    })));
    setStep("builder");
  };

  const handleStartScratch = () => {
    reset({
      name: "", description: "", instructions: "", pet_type: "dog", duration_days: 15, daily_portions: 2,
      is_template: false, pet_ids: petId ? [parseInt(petId)] : [],
      ingredients: []
    });
    setStep("builder");
  };

  // Success redirect timer
  useEffect(() => {
    if (confirmedRecipeId === null) return;
    const timer = setTimeout(() => router.push(petId ? `/pets/${petId}` : "/recipes"), 3000);
    return () => clearTimeout(timer);
  }, [confirmedRecipeId, router, petId]);

  if (confirmedRecipeId !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-bounce">
          <PartyPopper className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("recipe_confirmed_title")}</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {t("recipe_confirmed_desc")}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Button size="lg" className="gap-2" onClick={() => router.push(petId ? `/pets/${petId}` : "/recipes")}>
              <UtensilsCrossed className="w-5 h-5" />
              {t("my_recipes")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("recipe_confirmed_redirect")}
          </p>
        </div>
      </div>
    );
  }

  if (loadingIngredients || loadingTemplates) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === "builder" ? setStep("choose_method") : router.back()}
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {step === "choose_method" ? t("subtitle_method") : t("subtitle_builder")}
          </p>
        </div>
      </div>

      {step === "choose_method" && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div
            onClick={handleStartScratch}
            className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card hover:bg-primary/5 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-4 h-64"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t("create_scratch")}</h3>
              <p className="text-muted-foreground mt-2">{t("create_scratch_desc")}</p>
            </div>
          </div>

          <div className="border border-border bg-card rounded-2xl p-6 flex flex-col h-64">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">{t("use_template")}</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {t("use_template_desc")}
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {templates?.length === 0 && (
                <div className="text-sm text-center p-4 bg-muted/30 rounded-lg">{t("no_templates")}</div>
              )}
              {templates?.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.duration_days} dias • {t.ingredients.length} ingr.</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary opacity-0 hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "builder" && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            {pets && pets.length > 0 && (
              <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                  <Dog className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{t("link_pets_optional")}</h3>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pets.map(pet => (
                    <div key={pet.id} className="flex items-center space-x-2 border p-3 rounded-lg bg-background">
                      <Checkbox
                        id={`pet-${pet.id}`}
                        checked={watchedValues.pet_ids?.includes(pet.id)}
                        onCheckedChange={(checked) => {
                          const current = watchedValues.pet_ids || [];
                          if (checked) {
                            setValue("pet_ids", [...current, pet.id]);
                          } else {
                            setValue("pet_ids", current.filter(id => id !== pet.id));
                          }
                        }}
                      />
                      <label htmlFor={`pet-${pet.id}`} className="text-sm font-medium cursor-pointer flex-1 line-clamp-1 text-ellipsis">
                        {pet.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("basic_details")}</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("recipe_name")}</label>
                  <input
                    {...register("name", { required: true })}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.name && <span className="text-xs text-destructive">{t("required")}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t("description")}</label>
                  <textarea
                    {...register("description", { required: true })}
                    rows={2}
                    className={`w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50 ${errors.description ? "border-destructive" : ""}`}
                  />
                  {errors.description && <span className="text-xs text-destructive">{t("required")}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t("pet_type")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        const current = watchedValues.pet_type;
                        const isCat = current === "cat" || current === "both";
                        const isDog = current === "dog" || current === "both";

                        const newIsDog = !isDog;
                        let next = "";
                        if (newIsDog && isCat) next = "both";
                        else if (newIsDog && !isCat) next = "dog";
                        else if (!newIsDog && isCat) next = "cat";

                        if (next !== "") {
                          setValue("pet_type", next, { shouldValidate: true });
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-1 rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all",
                        (watchedValues.pet_type === "dog" || watchedValues.pet_type === "both")
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                      )}
                    >
                      <Dog className={cn("w-5 h-5", (watchedValues.pet_type === "dog" || watchedValues.pet_type === "both") ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-semibold">{tCat("dog")}</span>
                    </div>

                    <div
                      onClick={() => {
                        const current = watchedValues.pet_type;
                        const isCat = current === "cat" || current === "both";
                        const isDog = current === "dog" || current === "both";

                        const newIsCat = !isCat;
                        let next = "";
                        if (newIsCat && isDog) next = "both";
                        else if (newIsCat && !isDog) next = "cat";
                        else if (!newIsCat && isDog) next = "dog";

                        if (next !== "") {
                          setValue("pet_type", next, { shouldValidate: true });
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-1 rounded-lg p-2.5 flex flex-row items-center justify-center gap-2 transition-all",
                        (watchedValues.pet_type === "cat" || watchedValues.pet_type === "both")
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                      )}
                    >
                      <Cat className={cn("w-5 h-5", (watchedValues.pet_type === "cat" || watchedValues.pet_type === "both") ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-semibold">{tCat("cat")}</span>
                    </div>
                  </div>
                  <input type="hidden" {...register("pet_type")} />
                  {errors.pet_type && <span className="text-xs text-destructive mt-1 block">{tCommon("validation_required")}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{tCat("instructions")}</label>
                  <textarea
                    {...register("instructions")}
                    rows={3}
                    placeholder="Opcional. Ex: Cozinhar a vapor..."
                    className={`w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50 ${errors.instructions ? "border-destructive" : ""}`}
                  />
                  {errors.instructions && <span className="text-xs text-destructive">{errors.instructions.message}</span>}
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("ingredient_catalog")}</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                    placeholder={tCat("search_ingredient")}
                    value={searchIngredient}
                    onChange={(e) => setSearchIngredient(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Todos">{tCommon("all")}</option>
                      {Array.from(new Set(ingredients?.map(i => i.category).filter(Boolean))).map(cat => (
                        <option key={cat as string} value={cat as string}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {ingredients?.filter(ing => {
                    const matchSearch = ing.name.toLowerCase().includes(searchIngredient.toLowerCase());
                    const matchCategory = categoryFilter === "Todos" || ing.category === categoryFilter;
                    return matchSearch && matchCategory;
                  }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map(ing => {
                    const isSelected = watchedValues.ingredients.some(f => f.id === ing.id);
                    return (
                      <div
                        key={ing.id}
                        onClick={() => {
                          const index = watchedValues.ingredients.findIndex(f => f.id === ing.id);
                          if (index >= 0) {
                            remove(index);
                          } else {
                            append({ id: ing.id, quantity: 0, unit: ing.unit });
                          }
                        }}
                        className={cn(
                          "border p-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between min-h-[68px]",
                          isSelected ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-semibold text-xs leading-tight line-clamp-2">{ing.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-sm truncate max-w-[90px]">
                            {ing.category || "Geral"}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground bg-background/50 px-1 rounded">{ing.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("ingredients")}</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-primary/10 border border-primary/20 text-primary text-sm p-3 rounded-lg flex gap-2">
                  <Info className="w-5 h-5 shrink-0" />
                  <span><strong>{tCommon("error") === "Erro!" ? "Importante:" : tCommon("error") === "Error!" ? "Important:" : "Importante:"}</strong> {t("important_daily_qty")}</span>
                </div>

                <div className="space-y-3">
                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border rounded-md border-dashed">
                      {t("no_ingredients")}
                    </p>
                  )}
                  {fields.map((field, index) => {
                    const ingId = watchedValues.ingredients[index]?.id;
                    const ingName = ingredients?.find(i => i.id === ingId)?.name || "";
                    const ingUnit = watchedValues.ingredients[index]?.unit || "";
                    return (
                      <div key={field.id} className="flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-background hover:border-primary/40 transition-colors">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1 text-sm font-medium truncate min-w-0">{ingName}</span>
                        <div className="flex items-center rounded-md border overflow-hidden shrink-0 bg-background">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={focusedIngIdx === index
                              ? (watchedValues.ingredients[index]?.quantity || 0) === 0 ? "" : String(watchedValues.ingredients[index]?.quantity ?? "")
                              : (() => {
                                  const n = Number(watchedValues.ingredients[index]?.quantity);
                                  return isNaN(n) || n === 0 ? "" : n.toLocaleString("pt-BR", { maximumFractionDigits: 3, useGrouping: false });
                                })()
                            }
                            onFocus={() => setFocusedIngIdx(index)}
                            onBlur={() => setFocusedIngIdx(null)}
                            onChange={e => {
                              const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".").replace(/^(\d*\.?\d*).*/, "$1");
                              setValue(`ingredients.${index}.quantity`, parseFloat(v) || 0);
                            }}
                            className="w-24 px-2 py-1.5 text-sm text-right border-0 focus:outline-none focus:ring-0 bg-background"
                          />
                          <span className="px-2 py-1.5 bg-muted text-xs font-medium text-muted-foreground border-l shrink-0">{ingUnit}</span>
                        </div>
                        <input type="hidden" {...register(`ingredients.${index}.unit` as const)} />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("planning_and_portions")}</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("duration_days")}</label>
                  <input
                    type="number"
                    min="1"
                    {...register("duration_days", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50 ${errors.duration_days ? "border-destructive" : ""}`}
                  />
                  {errors.duration_days && <span className="text-xs text-destructive">{tCommon("validation_positive_number")}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("daily_portions")}</label>
                  <input
                    type="number"
                    min="1"
                    {...register("daily_portions", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50 ${errors.daily_portions ? "border-destructive" : ""}`}
                  />
                  {errors.daily_portions && <span className="text-xs text-destructive">{tCommon("validation_positive_number")}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground flex-1">{t("cost_summary")}</h3>
                {isCalculatingCost && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>

              <div className="p-5 space-y-4">
                {user?.role === "customer" && totalWeightAcrossDays < 1.5 ? (
                  <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>
                      {t("weight_warning")}<br/>
                      <strong>{t("current_weight")}</strong> {(totalWeightAcrossDays * 1000).toFixed(0)}g
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Total cost — always visible */}
                    <div className="border-b pb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          {t("estimated_cost")}
                          {isCalculatingCost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        </span>
                        <span className="text-2xl font-bold text-primary">R$ {estimatedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {costPerKg > 0 && (
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                          <span>Baseado em {watchedValues.duration_days} dia(s)</span>
                          <span>R$ {costPerKg.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg ({totalWeightAcrossDays.toFixed(3)} kg total)</span>
                        </div>
                      )}
                    </div>

                    {validIngredients.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground italic py-3 flex items-center justify-center gap-2">
                        <Info className="w-3 h-3" />
                        {t("add_ingredients_simulate")}
                      </p>
                    )}

                    {/* Accordion — recipe detail */}
                    {validIngredients.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRecipeDetailOpen(v => !v)}
                          className="w-full flex items-center justify-between py-3 border-b text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> {t("recipe_composition")}</span>
                          {recipeDetailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {recipeDetailOpen && (
                          <div className="py-3 space-y-3 border-b">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{t("total_duration")}</span>
                              <span className="font-semibold">{watchedValues.duration_days} {tCat("days")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{t("daily_portions_label")}</span>
                              <span className="font-semibold">{watchedValues.daily_portions} {t("portions_per_day_plural")}</span>
                            </div>
                            <div>
                              <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                                <span>{tCommon("ingredient")}</span>
                                <span className="text-right">{t("qty_per_day")}</span>
                                <span className="text-right">{t("per_portion")}</span>
                              </div>
                              <ul className="space-y-1.5">
                                {validIngredients.map((item, idx) => {
                                  const ing = ingredients?.find(i => i.id === item.id);
                                  const qty = Number(item.quantity);
                                  const portions = Number(watchedValues.daily_portions) || 1;
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
                          </div>
                        )}

                      </>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={createRecipe.isPending || isCalculatingCost || (user?.role === "customer" && totalWeightAcrossDays < 1.5)}
                  className="w-full mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                >
                  {createRecipe.isPending ? t("saving") : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" /> {t("save_final")}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
