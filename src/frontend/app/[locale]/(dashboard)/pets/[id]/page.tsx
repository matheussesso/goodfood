"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { usePet } from "@/hooks/usePets";
import { ArrowLeft, Dog, Loader2, UtensilsCrossed, Package, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function PetProfilePage() {
  const params = useParams();
  const id = params.id as string;
  
  const t = useTranslations("Pets");
  const tNav = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  
  const { pet, isLoading } = usePet(id);
  
  const [activeTab, setActiveTab] = useState<"overview" | "recipes" | "orders">("overview");

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!pet) {
    return <div className="p-8 text-center text-destructive">Pet não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pets" className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {pet.name}
          </h1>
          <p className="text-muted-foreground mt-1">{t("pet_profile")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Pet Identity */}
        <Card className="md:col-span-1 border-primary/20">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            {pet.photo_url ? (
              <img src={pet.photo_url} alt={pet.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary/10 mb-4" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border-4 border-primary/20">
                <Dog className="w-16 h-16" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-foreground">{pet.name}</h2>
            <p className="text-muted-foreground capitalize">{pet.type === 'cat' ? t("cat") : t("dog")}</p>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {(pet.allergies || pet.restrictions || pet.special_needs) && (
                <>
                  {pet.allergies && <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">{t("badge_allergies")}</span>}
                  {pet.restrictions && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">{t("badge_restrictions")}</span>}
                  {pet.special_needs && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">{t("badge_special_needs")}</span>}
                </>
              )}
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider mb-1">{t("age_months")}</span>
                <span className="font-semibold text-lg">{pet.age ? pet.age : '-'}</span>
              </div>
              <div className="flex flex-col items-center border-l border-border/50">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider mb-1">{t("weight_kg")}</span>
                <span className="font-semibold text-lg">{pet.weight ? pet.weight : '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Tabs Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex space-x-2 border-b">
            {(["overview", "recipes", "orders"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"}`}
              >
                {tab === "overview" ? t("pet_details") : tab === "recipes" ? t("recipes") : t("orders")}
              </button>
            ))}
          </div>
          
          {activeTab === "overview" && (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Dog className="w-5 h-5 mr-2 text-primary" /> {t("breed_and_traits")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-foreground block">{t("breed")}</span>
                      <span className="text-sm text-muted-foreground">{pet.breed || t("no_breed")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-amber-600 dark:text-amber-500">{t("alerts_and_needs")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground block">{t("dietary_restrictions")}</span>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{pet.restrictions || "Nenhuma restrição registrada."}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground block">{t("allergies")}</span>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{pet.allergies || "Nenhuma alergia registrada."}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground block">{t("special_needs")}</span>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{pet.special_needs || "Nenhuma necessidade especial registrada."}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === "recipes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <UtensilsCrossed className="w-5 h-5 mr-2 text-primary" />
                  {t("pet_recipes")}
                </h3>
              </div>
              
              {pet.recipes && pet.recipes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pet.recipes.map(recipe => (
                    <Card key={recipe.id} className="relative overflow-hidden group border-muted">
                      <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg line-clamp-1">{recipe.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">{recipe.description || "Nenhuma descrição."}</p>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                          <span className="text-muted-foreground">Duração: {recipe.duration_days} dias</span>
                          <span className="font-semibold text-primary">R$ {Number(recipe.base_cost).toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 border rounded-lg">
                  <UtensilsCrossed className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Seu pet ainda não tem receitas vinculadas.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              {pet.orders && pet.orders.length > 0 ? (
                <div className="space-y-3">
                  {pet.orders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Pedido #{order.id}</span>
                          <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">{order.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="font-semibold text-primary mt-2 sm:mt-0 text-lg">R$ {order.total_price}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 border rounded-lg">
                  <Package className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum pedido feito para este pet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
