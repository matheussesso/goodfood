"use client";

import { useTranslations } from "next-intl";
import { useRecipes } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Plus, Search, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function RecipesPage() {
  const t = useTranslations("Navigation");
  const { recipes, isLoading } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecipes = recipes?.filter(
    (r) => !r.is_template && r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar receita..."
            className="w-full pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes?.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block h-full transition-transform hover:-translate-y-1">
              <Card className="flex flex-col h-full hover:border-primary/50 cursor-pointer">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-1" title={recipe.name}>
                        {recipe.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1 min-h-10">
                        {recipe.description || "Sem descrição."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Espécie</span>
                      <span className="font-medium">{recipe.pet_type === 'cat' ? 'Gato' : 'Cachorro'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Duração</span>
                      <span className="font-medium">{recipe.duration_days} dias</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Custo</span>
                      <span className="font-medium text-primary">R$ {Number(recipe.base_cost).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Ingredientes</span>
                      <span className="font-medium">{recipe.ingredients.length} itens</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
