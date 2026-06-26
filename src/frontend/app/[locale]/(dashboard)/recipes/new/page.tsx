"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Ingredient } from "@/hooks/useIngredients";
import { calculateRecipeCost, Recipe } from "@/hooks/useRecipes";
import { ArrowLeft, Save, Plus, Trash2, UtensilsCrossed, FileText, CheckCircle2, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeFormData {
  name: string;
  description: string;
  pet_type: string;
  duration_days: number;
  daily_portions: number;
  instructions: string;
  is_template: boolean;
  pet_id?: number | null;
  ingredients: {
    id: number;
    quantity: number;
    unit: string;
  }[];
}

export default function NewRecipePage() {
  const tNav = useTranslations("Navigation");
  const t = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("pet_id");
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"choose_method" | "builder">("choose_method");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);

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

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RecipeFormData>({
    defaultValues: {
      name: "",
      description: "",
      pet_type: "dog",
      duration_days: 15,
      daily_portions: 2,
      is_template: false,
      pet_id: petId ? parseInt(petId) : null,
      ingredients: [{ id: 0, quantity: 0, unit: "kg" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  });

  const watchedValues = watch();
  const { user } = require("@/hooks/useAuth").useAuth();

  // Calculate total weight in kg (for render and logic)
  const validIngredients = watchedValues.ingredients.filter(i => i.id > 0 && Number(i.quantity) > 0);
  let totalWeightKg = 0;
  validIngredients.forEach(i => {
    const qty = Number(i.quantity);
    if (i.unit === "g" || i.unit === "ml") totalWeightKg += qty / 1000;
    else if (i.unit === "kg" || i.unit === "l") totalWeightKg += qty;
    else if (i.unit === "unit") totalWeightKg += qty * 0.1; // roughly 100g per unit if unknown
  });

  // Watch for cost calculation
  useEffect(() => {
    if (step !== "builder") return;

    const fetchCost = async () => {
      // Customer constraint: must be >= 1.5kg
      if (user?.role === "customer" && totalWeightKg < 1.5) {
        setEstimatedCost(0);
        setCostBreakdown([]);
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
    
    const timeoutId = setTimeout(fetchCost, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedValues.ingredients, watchedValues.duration_days, watchedValues.daily_portions, step, user?.role]);

  const createRecipe = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      const response = await apiClient.post("/recipes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      if (petId) {
        router.push(`/pets/${petId}`);
      } else {
        router.push("/dashboard");
      }
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
    setValue("name", template.name + " (Cópia)");
    setValue("description", template.description || "");
    setValue("pet_type", template.pet_type || "dog");
    setValue("duration_days", template.duration_days || 15);
    setValue("daily_portions", template.daily_portions || 2);
    setValue("ingredients", template.ingredients.map(i => ({
      id: i.id,
      quantity: Number(i.pivot.quantity),
      unit: i.pivot.unit || i.unit
    })));
    setStep("builder");
  };

  const handleStartScratch = () => {
    reset({
      name: "", description: "", pet_type: "dog", duration_days: 15, daily_portions: 2,
      is_template: false, pet_id: petId ? parseInt(petId) : null,
      ingredients: [{ id: 0, quantity: 0, unit: "kg" }]
    });
    setStep("builder");
  };

  if (loadingIngredients || loadingTemplates) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === "builder" ? setStep("choose_method") : router.back()}
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
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
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">{t("basic_details")}</h3>
              
              <div className="space-y-4">
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
                    {...register("description")}
                    rows={2}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("pet_type")}</label>
                    <select
                      {...register("pet_type")}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="dog">{tCat("dog")}</option>
                      <option value="cat">{tCat("cat")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("duration_days")}</label>
                    <input
                      type="number"
                      {...register("duration_days", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("daily_portions")}</label>
                    <input
                      type="number"
                      {...register("daily_portions", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2 flex justify-between items-center">
                {t("ingredients")}
                <button
                  type="button"
                  onClick={() => append({ id: 0, quantity: 0, unit: "kg" })}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded hover:bg-secondary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" /> {t("add_ingredient")}
                </button>
              </h3>
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select
                        {...register(`ingredients.${index}.id` as const, { valueAsNumber: true })}
                        className="w-full px-2 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                      >
                        <option value={0}>{tCommon("select")}</option>
                        {ingredients?.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Qtd"
                        {...register(`ingredients.${index}.quantity` as const, { valueAsNumber: true })}
                        className="w-full px-2 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="w-20">
                      <select
                        {...register(`ingredients.${index}.unit` as const)}
                        className="w-full px-2 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="unit">un</option>
                        <option value="l">l</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 mt-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                    {t("no_ingredients")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2 flex items-center gap-2">
                {t("cost_summary")}
                {isCalculatingCost && <Loader2 className="w-4 h-4 animate-spin" />}
              </h3>
              
              <div className="space-y-4">
                {user?.role === "customer" && totalWeightKg < 1.5 ? (
                  <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>
                      {t("weight_warning")}<br/>
                      <strong>{t("current_weight")}</strong> {(totalWeightKg * 1000).toFixed(0)}g
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
                      <span className="text-sm font-medium">{t("estimated_cost")}</span>
                      <span className="text-2xl font-bold text-primary">R$ {estimatedCost.toFixed(2)}</span>
                    </div>

                    <div className="text-sm space-y-2">
                      <p className="font-medium text-foreground">{t("cost_breakdown")}</p>
                      <ul className="space-y-1.5 text-muted-foreground text-xs">
                        {costBreakdown?.filter(item => item.is_supplement).map((item, idx) => (
                          <li key={idx} className="flex justify-between border-b border-border/50 pb-1">
                            <span>{item.name}</span>
                            <span>R$ {Number(item.total_cost).toFixed(2)}</span>
                          </li>
                        ))}
                        {(!costBreakdown || costBreakdown.length === 0) && (
                          <li className="text-center italic py-2 flex items-center justify-center gap-2">
                            <Info className="w-3 h-3" />
                            {t("add_ingredients_simulate")}
                          </li>
                        )}
                      </ul>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={createRecipe.isPending || isCalculatingCost || (user?.role === "customer" && totalWeightKg < 1.5)}
                  className="w-full mt-6 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
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
