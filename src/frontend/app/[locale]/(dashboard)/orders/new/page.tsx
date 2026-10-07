"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useOrders, CreateOrderPayload, OrderItemPayload } from "@/hooks/useOrders";
import { usePets } from "@/hooks/usePets";
import { useAuth } from "@/hooks/useAuth";
import { Recipe } from "@/hooks/useRecipes";
import { AddressFields, EMPTY_ADDRESS, type AddressValue } from "@/components/address/AddressFields";
import { formatCep } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, CalendarCheck, Dog, Cat, UtensilsCrossed, CheckCircle2, ChevronDown, ChevronUp, Loader2, MapPin, Trash2, BookUser, Clock, Salad, Layers, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tuple identifying a unique recipe selection scoped to a specific pet. */
interface SelectedItem {
  petId: number;
  recipeId: number;
}

/**
 * Dedicated page for creating a new order. Opens on a type-choice step —
 * one-off order vs. recurring subscription — then, for the one-off path,
 * lets the customer pick recipes from one or more pets independently (the
 * same recipe can be selected for different pets, generating separate order
 * items). The subscription path hands off to `/orders/subscriptions/new`,
 * which owns the weekly-plan builder.
 *
 * @returns The new order creation page element.
 */
export default function NewOrderPage() {
  const t = useTranslations("Orders");
  const tPets = useTranslations("Pets");
  const tRec = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");

  const router = useRouter();
  const { pets, isLoading: petsLoading } = usePets();
  const { createOrder, isCreating } = useOrders();
  const user = useAuth((s) => s.user);

  /** "choose" shows the order-type picker; "single" shows the one-off order builder below. */
  const [step, setStep] = useState<"choose" | "single">("choose");

  const [expandedPets, setExpandedPets] = useState<number[]>([]);

  /** Unique selections: one entry per (petId, recipeId) tuple. */
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);

  /** Field-level validation errors. */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Set after successful order creation — triggers success screen. */
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);

  /** Submit error message shown below the button. */
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Auto-redirect to /orders 3 s after successful confirmation. */
  useEffect(() => {
    if (confirmedOrderId === null) return;
    const timer = setTimeout(() => router.push("/orders"), 3000);
    return () => clearTimeout(timer);
  }, [confirmedOrderId, router]);

  /** Flat map of recipe objects by id — needed to look up base_cost and name. */
  const allRecipesById = useMemo<Record<number, Recipe>>(() => {
    const map: Record<number, Recipe> = {};
    pets?.forEach((pet) => {
      pet.recipes?.filter((r) => !r.is_template).forEach((r) => {
        map[r.id] = r;
      });
    });
    return map;
  }, [pets]);

  const total = useMemo<number>(() => {
    return selectedItems.reduce((sum, item) => {
      return sum + Number(allRecipesById[item.recipeId]?.base_cost ?? 0);
    }, 0);
  }, [selectedItems, allRecipesById]);

  /** Key for deduplicating within the same pet — not across pets. */
  function itemKey(petId: number, recipeId: number) {
    return `${petId}_${recipeId}`;
  }

  function isSelected(petId: number, recipeId: number) {
    return selectedItems.some(
      (it) => it.petId === petId && it.recipeId === recipeId
    );
  }

  function togglePet(petId: number) {
    setExpandedPets((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  }

  function toggleRecipe(petId: number, recipeId: number) {
    if (isSelected(petId, recipeId)) {
      setSelectedItems((prev) =>
        prev.filter((it) => !(it.petId === petId && it.recipeId === recipeId))
      );
    } else {
      setSelectedItems((prev) => [...prev, { petId, recipeId }]);
    }
  }

  function removeItem(petId: number, recipeId: number) {
    setSelectedItems((prev) =>
      prev.filter((it) => !(it.petId === petId && it.recipeId === recipeId))
    );
  }

  /** Fill address fields from the user's registered address. */
  function fillRegisteredAddress() {
    if (!user) return;
    setAddress({
      zipcode: formatCep(user.zipcode ?? ""),
      street: user.street ?? "",
      number: user.number ?? "",
      complement: user.complement ?? "",
      neighborhood: user.neighborhood ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
    });
    setErrors((p) => ({ ...p, street: "", number: "", city: "", state: "", zipcode: "" }));
  }

  /** Build a formatted address string from the individual fields, or undefined if empty. */
  function buildAddress(): string | undefined {
    const streetLine = [address.street, address.number].filter(Boolean).join(", ");
    const parts = [
      streetLine,
      address.complement,
      address.neighborhood,
      address.city && address.state ? `${address.city}/${address.state}` : address.city,
      address.zipcode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" — ") : undefined;
  }

  /** Validates the form; returns true if valid. Populates `errors` otherwise. */
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (selectedItems.length === 0) {
      newErrors.items = t("error_no_items");
    }

    if (!address.street.trim())  newErrors.street  = t("error_street_required");
    if (!address.number.trim())  newErrors.number  = t("error_number_required");
    if (!address.city.trim())    newErrors.city    = t("error_city_required");
    if (!address.state.trim())   newErrors.state   = t("error_state_required");
    if (!address.zipcode.trim()) newErrors.zipcode = t("error_zipcode_required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitError(null);

    const items: OrderItemPayload[] = selectedItems.map((it) => ({
      recipe_id: it.recipeId,
      pet_id: it.petId,
    }));

    const payload: CreateOrderPayload = {
      items,
      delivery_address: buildAddress(),
    };

    try {
      const result = await createOrder(payload);
      setConfirmedOrderId(result?.data?.id ?? null);
    } catch {
      setSubmitError(t("error_submit"));
    }
  }

  const petNameById = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    pets?.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [pets]);

  const hasRegisteredAddress = !!(user?.street || user?.city);

  /* ── Success screen ──────────────────────────────────────────────── */
  if (confirmedOrderId !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-bounce">
          <PartyPopper className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("order_confirmed_title")}</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {t("order_confirmed_desc", { id: String(confirmedOrderId) })}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link href="/orders">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="w-5 h-5" />
                {t("view_orders")}
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("order_confirmed_redirect")}
          </p>
        </div>
      </div>
    );
  }

  /* ── Type-choice step ────────────────────────────────────────────── */
  if (step === "choose") {
    return (
      <div className="space-y-6">
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
              {t("choose_order_type_title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("choose_order_type_desc")}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-2">
          <button
            type="button"
            onClick={() => setStep("single")}
            className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card hover:bg-primary/5 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-4 h-64"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{t("order_type_single_title")}</h3>
              <p className="text-muted-foreground mt-2">{t("order_type_single_desc")}</p>
            </div>
          </button>

          <Link
            href="/orders/subscriptions/new"
            className="border border-border bg-card hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center gap-4 h-64"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{t("order_type_subscription_title")}</h3>
              <p className="text-muted-foreground mt-2">{t("order_type_subscription_desc")}</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setStep("choose")}
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            {t("new_order")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("new_order_desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: Pet & recipe selection ───────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {petsLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground bg-card border rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">{t("loading_pets")}</span>
            </div>
          ) : !pets || pets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground text-center">
              <Dog className="w-10 h-10 opacity-30" />
              <p className="text-sm">{tPets("no_pets")}</p>
              <Link href="/pets">
                <Button variant="outline" size="sm">{t("register_pet")}</Button>
              </Link>
            </div>
          ) : (
            pets.map((pet) => {
              const PetIcon = pet.type === "cat" ? Cat : Dog;
              const isExpanded = expandedPets.includes(pet.id);
              const petRecipes = (pet.recipes ?? []).filter((r) => !r.is_template);
              const selectedCount = petRecipes.filter((r) =>
                isSelected(pet.id, r.id)
              ).length;
              const speciesLabel = pet.type === "cat" ? tPets("cat") : tPets("dog");

              return (
                <div key={pet.id} className="bg-card border rounded-xl shadow-sm overflow-hidden">
                  {/* Pet accordion header */}
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
                            {selectedCount} {selectedCount === 1 ? t("selected_singular") : t("selected_plural")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {pet.breed || speciesLabel} · {petRecipes.length}{" "}
                        {petRecipes.length === 1 ? t("items_count") : t("items_count_plural")}
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
                          {t("no_recipes_for_pet", { name: pet.name })}
                        </p>
                      ) : (
                        petRecipes.map((recipe) => {
                          const sel = isSelected(pet.id, recipe.id);
                          const key = itemKey(pet.id, recipe.id);
                          return (
                            <div key={key}>
                            <button
                              type="button"
                              onClick={() => toggleRecipe(pet.id, recipe.id)}
                              className={cn(
                                "w-full flex items-start gap-4 px-4 py-4 text-left transition-colors",
                                sel ? "bg-primary/5" : "hover:bg-muted/20"
                              )}
                            >
                              {/* Checkbox visual */}
                              <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                sel ? "bg-primary border-primary" : "border-border"
                              )}>
                                {sel && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
                              </div>

                              {/* Recipe icon */}
                              <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                sel ? "bg-primary/15" : "bg-muted/60"
                              )}>
                                <UtensilsCrossed className={cn("w-4 h-4", sel ? "text-primary" : "text-muted-foreground")} />
                              </div>

                              {/* Info block */}
                              <div className="flex-1 min-w-0">
                                <p className={cn("font-semibold text-sm leading-snug", sel ? "text-primary" : "text-foreground")}>
                                  {recipe.name}
                                </p>
                                {recipe.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {recipe.description}
                                  </p>
                                )}

                                {/* Stats row */}
                                <div className="flex items-center gap-0 divide-x divide-border mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                                  {recipe.duration_days && (
                                    <span className="flex items-center gap-1 pr-2">
                                      <Clock className="w-3 h-3" />
                                      {recipe.duration_days} {tCat("days")}
                                    </span>
                                  )}
                                  {recipe.daily_portions && (
                                    <span className="flex items-center gap-1 px-2">
                                      <Salad className="w-3 h-3" />
                                      {recipe.daily_portions} {tCat("daily_portions").toLowerCase()}
                                    </span>
                                  )}
                                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                                    <span className="flex items-center gap-1 pl-2">
                                      <Layers className="w-3 h-3" />
                                      {recipe.ingredients.length} {tRec("ingredients").toLowerCase()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Price */}
                              <span className={cn("text-sm font-bold shrink-0 mt-0.5", sel ? "text-primary" : "text-amber-600 dark:text-amber-400")}>
                                R$ {Number(recipe.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </button>
                            </div>
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

        {/* ── Right: Order summary + address (sticky) ────────────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          {/* Recipe list summary */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">{t("order_summary")}</h2>
            </div>

            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground text-center px-4">
                <UtensilsCrossed className="w-8 h-8 opacity-30" />
                <p className="text-sm">{t("select_recipes_hint")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {selectedItems.map((item) => {
                  const recipe = allRecipesById[item.recipeId];
                  return (
                    <div key={itemKey(item.petId, item.recipeId)} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {recipe?.name ?? `#${item.recipeId}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {petNameById[item.petId] ?? ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                        R$ {Number(recipe?.base_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.petId, item.recipeId)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-5 py-4 border-t bg-muted/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("total")}</span>
              <span className="text-2xl font-bold text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {t("delivery_optional")}
              </h2>
              {hasRegisteredAddress && (
                <button
                  type="button"
                  onClick={fillRegisteredAddress}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                >
                  <BookUser className="w-3.5 h-3.5" />
                  {t("use_registered_address")}
                </button>
              )}
            </div>
            <div className="px-5 py-4 space-y-3">
              <AddressFields
                value={address}
                errors={errors}
                idPrefix="order"
                onChange={(patch) => {
                  setAddress((current) => ({ ...current, ...patch }));
                  setErrors((previous) => ({ ...previous, ...Object.fromEntries(Object.keys(patch).map((key) => [key, ""])) }));
                }}
              />
            </div>
          </div>

          {/* Submit */}
          {errors.items && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {errors.items}
            </p>
          )}
          {submitError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {submitError}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="w-full gap-2"
            size="lg"
          >
            {isCreating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
            {isCreating
              ? t("creating")
              : `${t("confirm_order")}${selectedItems.length > 0 ? ` (${selectedItems.length})` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
