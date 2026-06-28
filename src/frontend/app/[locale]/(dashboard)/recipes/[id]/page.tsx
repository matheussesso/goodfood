"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import {
  ArrowLeft,
  Edit,
  UtensilsCrossed,
  Info,
  CalendarClock,
  Package,
  FileText,
  Loader2,
  CheckCircle,
  DollarSign,
  Scale,
  ChevronRight,
  Dog,
} from "lucide-react";
import { useRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

/**
 * Customer-facing recipe detail page.
 * Displays full recipe information including ingredients table, instructions, and cost.
 *
 * @returns The recipe detail page element.
 */
export default function RecipeDetailPage() {
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const { recipe, isLoading, error } = useRecipe(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">{tCommon("loading")}</span>
      </div>
    );
  }

  if (!recipe || error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{tRec("recipe_not_found")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {tRec("recipe_not_found_desc")}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {tCommon("back")}
        </Button>
      </div>
    );
  }

  const canEdit = !recipe.is_template || user?.role === "admin";
  const petLabel = recipe.pet_type === "cat" ? tCat("cat") : recipe.pet_type === "dog" ? tCat("dog") : tCommon("all");

  return (
    <div className="space-y-6 mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{recipe.name}</h1>
              {recipe.is_template && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                  {tRec("model")}
                </span>
              )}
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  recipe.is_active
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {recipe.is_active ? tCommon("active") : tCommon("inactive")}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {recipe.description || tRec("no_description")}
            </p>
          </div>
        </div>

        {canEdit && (
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Button variant="secondary" className="gap-2">
              <Edit className="w-4 h-4" /> {tCommon("edit")}
            </Button>
          </Link>
        )}
      </div>

      {/* ── Quick stats row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Dog, label: tRec("pet_type"), value: petLabel, color: "text-primary bg-primary/10" },
          { icon: CalendarClock, label: tCat("duration"), value: `${recipe.duration_days ?? "—"} ${tCat("days")}`, color: "text-blue-600 bg-blue-500/10" },
          { icon: Package, label: tRec("portions_per_day_caps"), value: `${recipe.daily_portions ?? "—"}x`, color: "text-violet-600 bg-violet-500/10" },
          { icon: DollarSign, label: tRec("estimated_cost"), value: `R$ ${Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-amber-600 bg-amber-500/10" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="font-semibold text-sm text-foreground truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Ingredients table */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{tRec("recipe_composition")}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {recipe.ingredients.length} {recipe.ingredients.length === 1 ? tCommon("ingredient").toLowerCase() : tRec("ingredients").toLowerCase()}
              </span>
            </div>

            {recipe.duration_days && recipe.daily_portions && (
              <div className="px-5 py-3 border-b bg-primary/5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{recipe.duration_days}</strong> {tCat("days")}
                </span>
                <span>
                  <strong className="text-foreground">{recipe.daily_portions}</strong> {tRec("portions_per_day")}
                </span>
                <span>
                  <strong className="text-foreground">{recipe.duration_days * recipe.daily_portions}</strong> {tRec("meals_total")}
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs">
                    <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider">{tCommon("ingredient")}</th>
                    <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{tCommon("category")}</th>
                    <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-right">{tRec("qty_per_day")}</th>
                    <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-right hidden md:table-cell">{tRec("per_portion")}</th>
                    <th className="py-3 px-5 font-semibold text-muted-foreground uppercase tracking-wider text-right hidden lg:table-cell">{tRec("total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {recipe.ingredients.map((ing) => {
                    const qtyPerDay = parseFloat(ing.pivot.quantity);
                    const unit = ing.pivot.unit || ing.unit;
                    const qtyPerPortion =
                      recipe.daily_portions && recipe.daily_portions > 0
                        ? qtyPerDay / recipe.daily_portions
                        : qtyPerDay;
                    const qtyTotal = recipe.duration_days ? qtyPerDay * recipe.duration_days : qtyPerDay;
                    return (
                      <tr key={ing.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-5 font-medium text-foreground">{ing.name}</td>
                        <td className="py-3.5 px-5 text-muted-foreground hidden sm:table-cell">
                          {ing.category ? (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{ing.category}</span>
                          ) : "—"}
                        </td>
                        <td className="py-3.5 px-5 text-right font-semibold">
                          {qtyPerDay.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {unit}
                        </td>
                        <td className="py-3.5 px-5 text-right text-muted-foreground hidden md:table-cell">
                          {qtyPerPortion.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {unit}
                        </td>
                        <td className="py-3.5 px-5 text-right text-muted-foreground hidden lg:table-cell">
                          {qtyTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {unit}
                        </td>
                      </tr>
                    );
                  })}
                  {recipe.ingredients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                        {tRec("no_ingredients_added")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{tRec("preparation_instructions")}</h3>
            </div>
            <div className="px-5 py-5">
              {recipe.instructions ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {recipe.instructions}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {tRec("no_instructions_added")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Cost card */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{tRec("estimated_cost")}</h3>
            </div>
            <div className="p-5">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
                <p className="text-xs text-primary/70 uppercase tracking-wider mb-1">{tRec("total")}</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  {tRec("cost_estimated_desc")}
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> {tRec("cost_per_kg")}
                  </span>
                  <span className="font-medium text-foreground">—</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{tRec("cost_per_day")}</span>
                  <span className="font-medium text-foreground">
                    {recipe.duration_days && recipe.base_cost
                      ? `R$ ${(Number(recipe.base_cost) / recipe.duration_days).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pets linked */}
          {recipe.pets && recipe.pets.length > 0 && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <Dog className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{tRec("linked_to")}</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {recipe.pets.map((pet) => (
                  <span
                    key={pet.id}
                    className="text-sm px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium"
                  >
                    {pet.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details card */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{tCommon("details")}</h3>
            </div>
            <div className="divide-y divide-border/50 text-sm">
              {[
                { label: tRec("pet_type"), value: petLabel },
                { label: tCat("duration"), value: `${recipe.duration_days ?? "—"} ${tCat("days")}` },
                { label: tRec("portions_per_day_caps"), value: `${recipe.daily_portions ?? "—"}` },
                { label: tRec("meals_total_caps"), value: recipe.duration_days && recipe.daily_portions ? `${recipe.duration_days * recipe.daily_portions}` : "—" },
                { label: tCommon("status"), value: recipe.is_active ? tCommon("active") : tCommon("inactive"), accent: recipe.is_active ? "text-emerald-600" : "text-destructive" },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex justify-between items-center px-5 py-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn("font-medium", accent)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit CTA */}
          {canEdit && (
            <Link href={`/recipes/${recipe.id}/edit`} className="block">
              <Button className="w-full gap-2" variant="secondary">
                <Edit className="w-4 h-4" /> {tRec("edit_recipe_cta")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
