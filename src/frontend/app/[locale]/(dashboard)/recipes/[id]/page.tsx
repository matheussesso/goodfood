"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { ArrowLeft, Edit, UtensilsCrossed, CheckCircle, Info, CalendarClock, Package, FileText } from "lucide-react";
import { useRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const tNav = useTranslations("Navigation");
  const tCat = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const t = useTranslations("Recipes");
  const router = useRouter();
  const { user } = useAuth();
  
  const { recipe, isLoading } = useRecipe(params.id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{tCommon("loading")}</div>;
  }

  if (!recipe) {
    return <div className="p-8 text-center text-destructive">404</div>; // Can just be 404 or add missing translation later
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
                  {t("use_template").split(" ")[0]} {tCat("recipe_name")} 
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span className="capitalize">{recipe.pet_type || "Global"}</span>
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
            <Edit className="w-4 h-4" /> {tCommon("edit")}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center border-b pb-2">
              <UtensilsCrossed className="w-5 h-5 mr-2 text-primary" />
              {t("ingredients")}
            </h3>
            
            {recipe.duration_days && recipe.daily_portions && (
              <div className="mb-4 bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground flex flex-wrap gap-4">
                <span><strong className="text-foreground">{recipe.duration_days}</strong> dias de duração</span>
                <span><strong className="text-foreground">{recipe.daily_portions}</strong> porções/dia</span>
                <span><strong className="text-foreground">{recipe.duration_days * recipe.daily_portions}</strong> refeições totais</span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-muted/30 text-sm">
                    <th className="py-3 px-4 font-medium text-muted-foreground">{tCat("ingredients")}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">{tCat("category")}</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground text-right">Qtd/dia</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground text-right hidden md:table-cell">Por porção</th>
                    <th className="py-3 px-4 font-medium text-muted-foreground text-right hidden lg:table-cell">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {recipe.ingredients.map((ing) => {
                    const qtyPerDay = parseFloat(ing.pivot.quantity);
                    const unit = ing.pivot.unit || ing.unit;
                    const qtyPerPortion = recipe.daily_portions && recipe.daily_portions > 0
                      ? qtyPerDay / recipe.daily_portions
                      : qtyPerDay;
                    const qtyTotal = recipe.duration_days ? qtyPerDay * recipe.duration_days : qtyPerDay;
                    return (
                      <tr key={ing.id} className="hover:bg-muted/10">
                        <td className="py-3 px-4 font-medium">{ing.name}</td>
                        <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{ing.category || "-"}</td>
                        <td className="py-3 px-4 text-right">{qtyPerDay.toFixed(3)} {unit}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground hidden md:table-cell">{qtyPerPortion.toFixed(3)} {unit}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground hidden lg:table-cell">{qtyTotal.toFixed(3)} {unit}</td>
                      </tr>
                    );
                  })}
                  {recipe.ingredients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        {t("no_ingredients")}
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
              {tCat("instructions")}
            </h3>
            {recipe.instructions ? (
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {recipe.instructions}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                -
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center border-b pb-2">
              <Info className="w-5 h-5 mr-2 text-primary" />
              {t("basic_details")}
            </h3>
            
            <div className="space-y-4">
              {recipe.description && (
                <div>
                  <p className="text-sm font-medium text-foreground">{t("description")}</p>
                  <p className="text-sm text-muted-foreground">{recipe.description}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground gap-2">
                   <CalendarClock className="w-4 h-4" />
                   <span className="text-sm">{t("duration_days")}</span>
                </div>
                <span className="font-medium text-sm">{recipe.duration_days} {tCat("days")}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center text-muted-foreground gap-2">
                   <Package className="w-4 h-4" />
                   <span className="text-sm">{t("daily_portions")}</span>
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
              <p className="text-sm text-primary font-medium mb-1">{t("estimated_cost")}</p>
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
