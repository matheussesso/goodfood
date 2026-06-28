"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useOrders, CreateOrderPayload } from "@/hooks/useOrders";
import { usePets } from "@/hooks/usePets";
import { Recipe } from "@/hooks/useRecipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ShoppingBag,
  Dog,
  Cat,
  UtensilsCrossed,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  MapPin,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dedicated page for creating a new order.
 * Lets the customer select recipes from one or more pets in a single order.
 *
 * @returns The new order page element.
 */
export default function NewOrderPage() {
  const router = useRouter();
  const { pets, isLoading: petsLoading } = usePets();
  const { createOrder, isCreating } = useOrders();

  /** IDs of expanded pet accordions. */
  const [expandedPets, setExpandedPets] = useState<number[]>([]);
  /** Selected recipe IDs across all pets. */
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  /** Flat map of all recipes by id across all pets. */
  const allRecipesById = useMemo<Record<number, Recipe>>(() => {
    const map: Record<number, Recipe> = {};
    pets?.forEach((pet) => {
      pet.recipes?.filter((r) => !r.is_template).forEach((r) => {
        map[r.id] = r;
      });
    });
    return map;
  }, [pets]);

  /** Selected recipe objects in insertion order. */
  const selectedRecipes = useMemo<Recipe[]>(() => {
    return selectedRecipeIds.map((id) => allRecipesById[id]).filter(Boolean);
  }, [selectedRecipeIds, allRecipesById]);

  /** Total price from sum of base_cost. */
  const total = useMemo<number>(() => {
    return selectedRecipes.reduce((s, r) => s + Number(r.base_cost ?? 0), 0);
  }, [selectedRecipes]);

  function togglePet(petId: number) {
    setExpandedPets((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  }

  function toggleRecipe(recipeId: number) {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  }

  function removeRecipe(recipeId: number) {
    setSelectedRecipeIds((prev) => prev.filter((id) => id !== recipeId));
  }

  async function handleSubmit() {
    if (selectedRecipeIds.length === 0) return;
    const payload: CreateOrderPayload = {
      recipe_ids: selectedRecipeIds,
      delivery_date: deliveryDate || undefined,
      delivery_address: deliveryAddress || undefined,
    };
    await createOrder(payload);
    router.push("/orders");
  }

  /** Returns the pet name for a given recipe id (first pet that has it). */
  function petNameForRecipe(recipeId: number): string {
    const pet = pets?.find((p) => p.recipes?.some((r) => r.id === recipeId));
    return pet?.name ?? "";
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          href="/orders"
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Novo Pedido
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selecione as receitas dos seus pets para o pedido.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: Pet & recipe selection ───────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {petsLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground bg-card border rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">Carregando pets...</span>
            </div>
          ) : !pets || pets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground text-center">
              <Dog className="w-10 h-10 opacity-30" />
              <p className="text-sm">Nenhum pet cadastrado.</p>
              <Link href="/pets">
                <Button variant="outline" size="sm">Cadastrar pet</Button>
              </Link>
            </div>
          ) : (
            pets.map((pet) => {
              const PetIcon = pet.type === "cat" ? Cat : Dog;
              const isExpanded = expandedPets.includes(pet.id);
              const petRecipes = (pet.recipes ?? []).filter((r) => !r.is_template);
              const selectedCount = petRecipes.filter((r) => selectedRecipeIds.includes(r.id)).length;

              return (
                <div key={pet.id} className="bg-card border rounded-xl shadow-sm overflow-hidden">
                  {/* Pet header — click to expand */}
                  <button
                    type="button"
                    onClick={() => togglePet(pet.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <PetIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{pet.name}</span>
                        {selectedCount > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-primary/15 text-primary rounded-full">
                            {selectedCount} selecionada{selectedCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {pet.breed || (pet.type === "cat" ? "Gato" : "Cachorro")} ·{" "}
                        {petRecipes.length} receita{petRecipes.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Recipe list */}
                  {isExpanded && (
                    <div className="border-t divide-y divide-border/50">
                      {petRecipes.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-muted-foreground text-center">
                          {pet.name} não tem receitas vinculadas.
                        </p>
                      ) : (
                        petRecipes.map((recipe) => {
                          const isSelected = selectedRecipeIds.includes(recipe.id);
                          return (
                            <button
                              key={recipe.id}
                              type="button"
                              onClick={() => toggleRecipe(recipe.id)}
                              className={cn(
                                "w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors",
                                isSelected
                                  ? "bg-primary/5"
                                  : "hover:bg-muted/20"
                              )}
                            >
                              {/* Checkbox visual */}
                              <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-border"
                              )}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
                              </div>

                              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                                <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>
                                  {recipe.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {recipe.duration_days}d · {recipe.ingredients?.length ?? 0} ingredientes
                                </p>
                              </div>

                              <span className={cn("text-sm font-bold shrink-0", isSelected ? "text-primary" : "text-amber-600 dark:text-amber-400")}>
                                R$ {Number(recipe.base_cost ?? 0).toFixed(2)}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: Order summary (sticky) ──────────────────────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">Resumo do Pedido</h2>
            </div>

            {selectedRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground text-center px-4">
                <UtensilsCrossed className="w-8 h-8 opacity-30" />
                <p className="text-sm">Selecione receitas ao lado.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {selectedRecipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{recipe.name}</p>
                      <p className="text-[11px] text-muted-foreground">{petNameForRecipe(recipe.id)}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                      R$ {Number(recipe.base_cost ?? 0).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRecipe(recipe.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="px-5 py-4 border-t bg-muted/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery details */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">Entrega (opcional)</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="delivery_date" className="text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Data de entrega
                </Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delivery_address" className="text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Endereço
                </Label>
                <Input
                  id="delivery_address"
                  placeholder="Rua, número — Cidade/UF"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isCreating || selectedRecipeIds.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {isCreating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
            {isCreating ? "Criando pedido..." : `Confirmar Pedido${selectedRecipes.length > 0 ? ` (${selectedRecipes.length})` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
