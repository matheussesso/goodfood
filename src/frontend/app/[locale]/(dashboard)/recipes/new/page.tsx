"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Ingredient } from "@/hooks/useIngredients";
import { ArrowLeft, Save, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/routing";

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
  const t = useTranslations("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("pet_id");
  const queryClient = useQueryClient();

  const { data: ingredients, isLoading: loadingIngredients } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Ingredient[] }>("/ingredients");
      return response.data.data;
    },
  });

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<RecipeFormData>({
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
    // Filter out invalid ingredients
    const validData = {
      ...data,
      ingredients: data.ingredients.filter(i => i.id > 0 && i.quantity > 0)
    };
    
    createRecipe.mutate(validData);
  };

  if (loadingIngredients) return <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-primary" />
            Nova Receita
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie uma nova receita do zero.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">Detalhes Básicos</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Receita</label>
              <input
                {...register("name", { required: true })}
                className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: Mix Frango e Batata Doce"
              />
              {errors.name && <span className="text-xs text-destructive">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                placeholder="Detalhes opcionais sobre a receita..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duração (Dias)</label>
                <input
                  type="number"
                  {...register("duration_days", { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Porções Diárias</label>
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
            Ingredientes
            <button
              type="button"
              onClick={() => append({ id: 0, quantity: 0, unit: "kg" })}
              className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </h3>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <select
                    {...register(`ingredients.${index}.id` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                  >
                    <option value={0}>Selecione um ingrediente...</option>
                    {ingredients?.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Qtd"
                    {...register(`ingredients.${index}.quantity` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="w-24">
                  <select
                    {...register(`ingredients.${index}.unit` as const)}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary/50"
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ingrediente adicionado.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end sticky bottom-6 bg-background/80 backdrop-blur p-4 rounded-xl border shadow-sm">
          <button
            type="submit"
            disabled={createRecipe.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2 disabled:opacity-50"
          >
            {createRecipe.isPending ? "Salvando..." : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Receita
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
