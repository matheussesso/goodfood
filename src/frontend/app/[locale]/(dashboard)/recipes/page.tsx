"use client";

import { useTranslations } from "next-intl";
import { useRecipes } from "@/hooks/useRecipes";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Plus, Search, Loader2, LayoutGrid, List as ListIcon, Eye, Edit2, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "@/i18n/routing";
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
  const tCat = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const { recipes, isLoading } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3 flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-primary mb-1" />
            {tRec("my_recipes")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecipes?.map(rec => (
            <Card key={rec.id} className="group hover:shadow-md hover:border-primary/30 transition-all overflow-hidden flex flex-col">
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm leading-tight truncate" title={rec.name}>{rec.name}</h4>
                      <span className="text-[11px] text-muted-foreground truncate block">{rec.description || tRec("no_description")}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Link href={`/recipes/${rec.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
                  <div className="px-1.5 py-2 text-center min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("pet_type")}</span>
                    <span className="font-medium text-xs truncate block">{rec.pet_type === 'cat' ? tCat("cat") : rec.pet_type === 'dog' ? tCat("dog") : tCommon("all")}</span>
                  </div>
                  <div className="px-1.5 py-2 text-center min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tCat("duration")}</span>
                    <span className="font-medium text-xs truncate block">{rec.duration_days}d</span>
                  </div>
                  <div className="px-1.5 py-2 text-center min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("portions_per_day_caps").split("/")[0]}</span>
                    <span className="font-medium text-xs truncate block">{rec.daily_portions}x</span>
                  </div>
                  <div className="px-1.5 py-2 text-center min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("estimated_cost")}</span>
                    <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">R$ {Number(rec.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {rec.ingredients && rec.ingredients.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setExpandedRecipes(prev => {
                        const next = new Set(prev);
                        if (next.has(rec.id)) next.delete(rec.id); else next.add(rec.id);
                        return next;
                      })}
                      className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                    >
                      <span>{tRec("recipe_composition")} ({rec.ingredients.length})</span>
                      {expandedRecipes.has(rec.id) ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                    </button>
                    {expandedRecipes.has(rec.id) && (
                      <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                        {rec.ingredients.map(i => (
                          <li key={i.id} className="flex items-center justify-between text-[11px] gap-2">
                            <span className="text-muted-foreground truncate flex-1">{i.name}</span>
                            <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">{i.pivot.quantity} {i.pivot.unit || i.unit}/dia</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1 mt-2.5 mb-2.5">
                  {rec.pets && rec.pets.length > 0 ? (
                    <>
                      {rec.pets.slice(0, 3).map((pet) => (
                        <span
                          key={pet.id}
                          className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium truncate max-w-[90px]"
                        >
                          {pet.name}
                        </span>
                      ))}
                      {rec.pets.length > 3 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">
                          +{rec.pets.length - 3}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">{tRec("no_pets_linked")}</span>
                  )}
                </div>

                <Link
                  href={`/recipes/${rec.id}`}
                  className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
                >
                  {tCommon("view")}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium rounded-tl-lg">{tRec("name")}</th>
                  <th className="px-6 py-3 font-medium text-center">{tRec("pet_type")}</th>
                  <th className="px-6 py-3 font-medium text-center">{tCat("duration")}</th>
                  <th className="px-6 py-3 font-medium text-center">{tRec("portions_per_day_caps")}</th>
                  <th className="px-6 py-3 font-medium text-center">{tRec("ingredients")}</th>
                  <th className="px-6 py-3 font-medium text-right">{tRec("estimated_cost")}</th>
                  <th className="px-6 py-3 font-medium text-right rounded-tr-lg">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredRecipes?.map(rec => (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold">{rec.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] mt-0.5">{rec.description}</div>
                      {rec.pets && rec.pets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {rec.pets.map(pet => (
                            <span key={pet.id} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-medium">
                              {pet.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">{rec.pet_type === 'cat' ? tCat('cat') : rec.pet_type === 'dog' ? tCat('dog') : tCommon('all')}</td>
                    <td className="px-6 py-3.5 text-center">{rec.duration_days} dias</td>
                    <td className="px-6 py-3.5 text-center">{rec.daily_portions}</td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="relative inline-flex group/ing cursor-default">
                        <span className="underline decoration-dotted decoration-muted-foreground/50">
                          {rec.ingredients?.length ?? 0}
                        </span>
                        {(rec.ingredients?.length ?? 0) > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover/ing:block pointer-events-none">
                            <div className="bg-popover border border-border shadow-lg rounded-lg p-2.5 text-left min-w-[180px] max-w-[260px]">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 border-b pb-1">{tRec("ingredients")}</p>
                              <ul className="space-y-1">
                                {rec.ingredients?.map(i => (
                                  <li key={i.id} className="flex items-center gap-1.5 text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    <span className="text-foreground truncate flex-1">{i.name}</span>
                                    <span className="text-muted-foreground text-[10px] shrink-0 ml-1">{String(parseFloat(i.pivot.quantity) || 0)}{i.pivot.unit || i.unit}/d</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="w-2.5 h-2.5 bg-popover border-b border-r border-border rotate-45 mx-auto -mt-[5px]" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-amber-600 dark:text-amber-400">R$ {Number(rec.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/recipes/${rec.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {!rec.is_template && (
                          <Link href={`/recipes/${rec.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit2 className="h-4 w-4" /></Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
