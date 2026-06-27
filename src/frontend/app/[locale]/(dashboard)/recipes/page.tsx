"use client";

import { useTranslations } from "next-intl";
import { useRecipes } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Plus, Search, Loader2, LayoutGrid, List as ListIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function RecipesPage() {
  const t = useTranslations("Navigation");
  const tCat = useTranslations("Catalog");
  const { recipes, isLoading } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "custom" | "template">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredRecipes = useMemo(() => {
    return recipes?.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterType === "custom") return !r.is_template && matchesSearch;
      if (filterType === "template") return r.is_template && matchesSearch;
      return matchesSearch;
    });
  }, [recipes, searchTerm, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            Minhas Receitas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as receitas formuladas para seus pets.
          </p>
        </div>
        <Link href="/recipes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar receita pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterType} onValueChange={(v: "all" | "custom" | "template") => setFilterType(v)}>
            <SelectTrigger className="w-full md:w-[200px] h-10">
              <SelectValue placeholder="Tipo de receita" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Receitas</SelectItem>
              <SelectItem value="custom">Minhas Receitas</SelectItem>
              <SelectItem value="template">Receitas Modelo</SelectItem>
            </SelectContent>
          </Select>

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
            <h3 className="text-lg font-semibold">Nenhuma receita encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm 
                ? "Nenhuma receita corresponde à sua busca."
                : "Você ainda não formulou nenhuma receita. Clique em Nova Receita para começar."}
            </p>
            {!searchTerm && (
              <Link href="/recipes/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Receita
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn("grid gap-4", viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {filteredRecipes?.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block transition-transform hover:-translate-y-1">
              <Card className={cn("flex hover:border-primary/50 cursor-pointer", viewMode === "grid" ? "flex-col h-full" : "flex-row items-center")}>
                <CardHeader className={cn("border-border/50 bg-muted/20", viewMode === "grid" ? "pb-3 border-b" : "w-1/3 border-r")}>
                  <div className="flex flex-col h-full justify-center">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1" title={recipe.name}>
                        {recipe.name}
                      </CardTitle>
                      {recipe.is_template && (
                        <Badge variant="secondary" className="shrink-0">Modelo</Badge>
                      )}
                    </div>
                    <CardDescription className={cn("mt-1", viewMode === "grid" ? "line-clamp-2 min-h-10" : "line-clamp-2")}>
                      {recipe.description || "Sem descrição."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className={cn("flex-1", viewMode === "grid" ? "pt-4" : "py-4")}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-2 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Espécie</span>
                      <span className="font-medium">{recipe.pet_type === 'cat' ? 'Gato' : recipe.pet_type === 'dog' ? 'Cachorro' : 'Todos'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Duração</span>
                      <span className="font-medium">{recipe.duration_days} dias</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Custo Base</span>
                      <span className="font-medium text-primary">R$ {Number(recipe.base_cost).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Ingredientes</span>
                      <span className="font-medium">{recipe.ingredients.length} itens</span>
                    </div>
                  </div>
                  
                  {recipe.pets && recipe.pets.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1">Vinculado a:</span>
                      {recipe.pets.map(pet => (
                        <Badge key={pet.id} variant="outline" className="text-xs bg-primary/5">
                          {pet.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
