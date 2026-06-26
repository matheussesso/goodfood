"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Edit, CalendarDays, UtensilsCrossed, PackageOpen, Plus, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "@/hooks/usePets";
import { Recipe } from "@/hooks/useRecipes";

export default function PetDetailPage({ params }: { params: { id: string } }) {
  const tNav = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const t = useTranslations("Pets");
  const tCat = useTranslations("Catalog");

  const { data: pet, isLoading: loadingPet } = useQuery({
    queryKey: ["pet", params.id],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Pet }>(`/pets/${params.id}`);
      return response.data.data;
    },
    enabled: !!params.id,
  });

  const { data: recipes, isLoading: loadingRecipes } = useQuery({
    queryKey: ["recipes", { petId: params.id }],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Recipe[] }>(`/recipes?pet_id=${params.id}`);
      return response.data.data.filter(r => !r.is_template && r.pet_id === parseInt(params.id));
    },
    enabled: !!params.id,
  });

  if (loadingPet) {
    return <div className="p-8 text-center text-muted-foreground">{tCommon("loading")}</div>;
  }

  if (!pet) {
    return <div className="p-8 text-center text-destructive">404</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/pets"
            className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {pet.name}
              <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full capitalize">
                {pet.type}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("pet_desc")}
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md font-medium text-sm transition-colors">
          <Edit className="w-4 h-4" /> {tCommon("edit")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-primary" />
              {t("pet_info")}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">{t("breed")}:</span>
                <span className="font-medium">{pet.breed || "-"}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">{t("age")}:</span>
                <span className="font-medium">{pet.age_years || 0} {t("years")}, {pet.age_months || 0} {t("months")}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">{t("weight")}:</span>
                <span className="font-medium">{pet.weight} kg</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">{t("body_condition")}:</span>
                <span className="font-medium">{pet.body_condition || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("activity_level")}:</span>
                <span className="font-medium capitalize">{pet.activity_level || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <UtensilsCrossed className="w-5 h-5 mr-2 text-primary" />
                {t("pet_recipes")}
              </h3>
              <Link 
                href={`/recipes/new?pet_id=${pet.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> {t("create_recipe")}
              </Link>
            </div>
            
            {loadingRecipes ? (
               <div className="p-4 text-center text-sm text-muted-foreground">{tCommon("loading")}</div>
            ) : recipes && recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="font-semibold text-lg text-foreground mb-1">{recipe.name}</div>
                    <div className="text-sm text-muted-foreground mb-3 line-clamp-2">{recipe.description}</div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-xs font-medium bg-secondary/30 text-secondary-foreground px-2 py-1 rounded">
                        {recipe.base_cost ? `${tCat("cost")}: R$ ${recipe.base_cost}` : t("not_calculated")}
                      </span>
                      <Link 
                        href={`/recipes/${recipe.id}`} 
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("view_details")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/10 rounded-lg border border-dashed">
                <UtensilsCrossed className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium mb-1">{t("no_recipes_found")}</p>
                <p className="text-sm text-muted-foreground mb-4">{t("no_recipes_desc")}</p>
                <Link 
                  href={`/recipes/new?pet_id=${pet.id}`}
                  className="inline-flex items-center text-primary font-medium text-sm hover:underline"
                >
                  {t("create_first_recipe")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
