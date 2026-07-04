"use client";

import { useTranslations } from "next-intl";
import { useRecipes } from "@/hooks/useRecipes";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Plus, Search, Loader2, LayoutGrid, List as ListIcon, Eye, Edit2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";


/**
 * RecipesPage component.
 * Displays a list of formulated recipes for the user's pets with search, view toggles, and navigation to details/editing.
 *
 * @returns The recipes page element.
 */
export default function RecipesPage() {
  const t = useTranslations("Navigation");
  const tCat = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const { recipes, isLoading } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredRecipes = useMemo(() => {
    return recipes?.filter((r) => {
      if (r.is_template) return false;
      return r.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [recipes, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            {tRec("my_recipes")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {tRec("manage_recipes_desc")}
          </p>
        </div>
        <Link href="/recipes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {tRec("title")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tRec("search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden md:flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRecipes?.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <UtensilsCrossed className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold">{tRec("no_recipes_found")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm 
                ? tRec("no_recipes_search_match")
                : tRec("no_recipes_yet")}
            </p>
            {!searchTerm && (
              <Link href="/recipes/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {tRec("create_first_recipe")}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-4", viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {filteredRecipes?.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
            >
              {/* Header */}
              <div className="p-4 pb-0 border-b border-border/50 bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/recipes/${recipe.id}`} className="hover:text-primary transition-colors">
                      <h3 className="font-semibold text-base line-clamp-1">{recipe.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 min-h-[2.5rem]">
                      {recipe.description || tRec("no_description")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats — divide-x */}
              <div className="flex divide-x divide-border/50 border-b border-border/50">
                <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tRec("pet_type")}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {recipe.pet_type === "cat" ? tCat("cat") : recipe.pet_type === "dog" ? tCat("dog") : tCommon("all")}
                  </span>
                </div>
                <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tCat("duration")}</span>
                  <span className="text-sm font-semibold text-foreground">{recipe.duration_days ?? "—"}d</span>
                </div>
                <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ingred.</span>
                  <span className="text-sm font-semibold text-foreground">{recipe.ingredients?.length ?? 0}</span>
                </div>
                <div className="flex-1 py-2.5 flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Custo Est.</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    R$ {Number((recipe as any).base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Pet badges */}
              {recipe.pets && recipe.pets.length > 0 && (
                <div className="px-4 py-2.5 border-b border-border/50 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">{tRec("linked_to")}:</span>
                  {recipe.pets.map((pet) => (
                    <span
                      key={pet.id}
                      className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium"
                    >
                      {pet.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions — always at bottom */}
              <div className="flex gap-2 p-3 mt-auto">
                <Link href={`/recipes/${recipe.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <Eye className="w-3.5 h-3.5" /> {tCommon("view")}
                  </Button>
                </Link>
                {!recipe.is_template && (
                  <Link href={`/recipes/${recipe.id}/edit`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
                      <Edit2 className="w-3.5 h-3.5" /> {tCommon("edit")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
