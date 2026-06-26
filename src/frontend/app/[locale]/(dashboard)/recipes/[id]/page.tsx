"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { ArrowLeft, Edit, UtensilsCrossed, CheckCircle, Info, CalendarClock, Package, FileText } from "lucide-react";
import { useRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { user } = useAuth();
  
  const { recipe, isLoading } = useRecipe(params.id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>;
  }

  if (!recipe) {
    return <div className="p-8 text-center text-destructive">Receita não encontrada</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {recipe.name}
              {recipe.is_template && (
                <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                  Modelo Global
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span className="capitalize">{recipe.pet_type || "Para todos"}</span>
              {recipe.pet_id && (
                <>
                   <span>&bull;</span>
                   <span>Pet ID: {recipe.pet_id}</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        {(!recipe.is_template || user?.role === "admin") && (
          <Link 
            href={`/recipes/${recipe.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-medium text-sm transition-colors"
          >
            <Edit className="w-4 h-4" /> Editar Receita
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center border-b pb-2">
              <UtensilsCrossed className="w-5 h-5 mr-2 text-primary" />
              Ingredientes
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-muted/30 text-sm">
                    <th className="py-3 px-4 font-medium text-muted-foreground">Ingrediente</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground">Categoria</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {recipe.ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-muted/10">
                      <td className="py-3 px-4 font-medium">{ing.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{ing.category || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        {parseFloat(ing.pivot.quantity).toFixed(3)} {ing.pivot.unit || ing.unit}
                      </td>
                    </tr>
                  ))}
                  {recipe.ingredients.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-muted-foreground">
                        Nenhum ingrediente registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center border-b pb-2">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Instruções de Preparo
            </h3>
            {recipe.instructions ? (
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {recipe.instructions}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Nenhuma instrução adicional fornecida.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center border-b pb-2">
              <Info className="w-5 h-5 mr-2 text-primary" />
              Resumo
            </h3>
            
            <div className="space-y-4">
              {recipe.description && (
                <div>
                  <p className="text-sm font-medium text-foreground">Descrição</p>
                  <p className="text-sm text-muted-foreground">{recipe.description}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground gap-2">
                   <CalendarClock className="w-4 h-4" />
                   <span className="text-sm">Duração</span>
                </div>
                <span className="font-medium text-sm">{recipe.duration_days} dias</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground gap-2">
                   <Package className="w-4 h-4" />
                   <span className="text-sm">Porções Diárias</span>
                </div>
                <span className="font-medium text-sm">{recipe.daily_portions}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground gap-2">
                   <CheckCircle className="w-4 h-4" />
                   <span className="text-sm">Status</span>
                </div>
                <span className="font-medium text-sm">
                  {recipe.is_active ? (
                    <span className="text-emerald-500">Ativa</span>
                  ) : (
                    <span className="text-destructive">Inativa</span>
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
              <p className="text-sm text-primary font-medium mb-1">Custo Estimado Base</p>
              <p className="text-3xl font-bold text-primary">
                R$ {recipe.base_cost}
              </p>
              <p className="text-xs text-primary/70 mt-2">
                *O preço final de venda será calculado no checkout do pedido considerando a logística.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
