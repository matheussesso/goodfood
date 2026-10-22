"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useOrders, CreateOrderPayload } from "@/hooks/useOrders";
import { usePets } from "@/hooks/usePets";
import { useAuth } from "@/hooks/useAuth";
import { Recipe } from "@/hooks/useRecipes";
import { AddressFields, EMPTY_ADDRESS, type AddressValue } from "@/components/address/AddressFields";
import { formatCep } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { JourneyEmptyState } from "@/features/onboarding/components/JourneyEmptyState";
import { useRecipeDurationCosts } from "@/hooks/useRecipeDurationCost";
import { PetMealPlan } from "@/features/orders/components/PetMealPlan";
import { MealPlanSummary } from "@/features/orders/components/MealPlanSummary";
import {
  addStep,
  moveStep,
  removeStep,
  setStepDuration,
  stepsForPet,
  toOrderItems,
  type MealPlanStep,
} from "@/features/orders/meal-plan";
import { ArrowLeft, ShoppingBag, Dog, Loader2, MapPin, BookUser, PartyPopper } from "lucide-react";

/**
 * Dedicated page for creating a new order as a meal plan: for each pet the
 * customer picks one or more of its recipes, how many days each one lasts and
 * the order they are fed in. Prices are calculated live for each duration.
 *
 * @returns The new order creation page element.
 */
export default function NewOrderPage() {
  const t = useTranslations("Orders");
  const tPets = useTranslations("Pets");
  const tOnboarding = useTranslations("Onboarding");

  const router = useRouter();
  const { pets, isLoading: petsLoading } = usePets();
  const { createOrder, isCreating } = useOrders();
  const user = useAuth((s) => s.user);
  const { updateProfile } = useProfile();
  const [saveAddress, setSaveAddress] = useState(true);

  /** Every pet's meal plan steps; a pet's steps are fed in array order. */
  const [plan, setPlan] = useState<MealPlanStep[]>([]);

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

  /** The pets' own recipes by id (templates are never ordered directly). */
  const recipesById = useMemo<Record<number, Recipe>>(() => {
    const map: Record<number, Recipe> = {};
    pets?.forEach((pet) => {
      pet.recipes?.filter((r) => !r.is_template).forEach((r) => {
        map[r.id] = r;
      });
    });
    return map;
  }, [pets]);

  const { costs, total, isLoading: isPricing } = useRecipeDurationCosts(
    plan.map((step) => ({ key: step.key, recipe: recipesById[step.recipeId], durationDays: step.durationDays }))
  );

  function updatePlan(next: MealPlanStep[]) {
    setPlan(next);
    setErrors((previous) => ({ ...previous, items: "" }));
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

    if (plan.length === 0) {
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

    const payload: CreateOrderPayload = {
      items: toOrderItems(plan),
      delivery_address: buildAddress(),
    };

    try {
      const result = await createOrder(payload);
      setConfirmedOrderId(result?.data?.id ?? null);

      // Keep the address for next time. The order is already placed, so a failure here is silent.
      if (saveAddress && !hasRegisteredAddress && user) {
        updateProfile({
          name: user.name,
          email: user.email,
          street: address.street,
          number: address.number,
          complement: address.complement || undefined,
          neighborhood: address.neighborhood || undefined,
          city: address.city,
          state: address.state,
          zipcode: address.zipcode.replace(/\D/g, ""),
        }).catch(() => undefined);
      }
    } catch {
      setSubmitError(t("error_submit"));
    }
  }

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

  /* ── Order builder ──────────────────────────────────────────────── */
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
            {t("new_order")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("new_order_desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: one meal plan per pet ────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {petsLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground bg-card border rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">{t("loading_pets")}</span>
            </div>
          ) : !pets || pets.length === 0 ? (
            <JourneyEmptyState
              icon={<Dog className="h-8 w-8" />}
              title={tPets("no_pets")}
              description={tOnboarding("orders_need_pet")}
              fallbackAction={{ href: "/pets/new", label: t("register_pet") }}
            />
          ) : (
            <>
            {pets.every((pet) => (pet.recipes ?? []).filter((r) => !r.is_template).length === 0) && (
              <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center">
                <span className="flex-1">{tOnboarding("orders_need_recipe")}</span>
                <Link href={`/pets/${pets[0].id}/recipes/new`}>
                  <Button size="sm">{tOnboarding("create_recipe_for_pet", { name: pets[0].name })}</Button>
                </Link>
              </div>
            )}
            {pets.map((pet) => (
              <PetMealPlan
                key={pet.id}
                pet={pet}
                recipes={(pet.recipes ?? []).filter((r) => !r.is_template)}
                steps={stepsForPet(plan, pet.id)}
                recipesById={recipesById}
                costs={costs}
                onAdd={(recipe) => updatePlan(addStep(plan, pet.id, recipe))}
                onRemove={(key) => updatePlan(removeStep(plan, key))}
                onMove={(key, direction) => updatePlan(moveStep(plan, key, direction))}
                onDurationChange={(key, days, min) => updatePlan(setStepDuration(plan, key, days, min))}
              />
            ))}
            </>
          )}
        </div>

        {/* ── Right: Order summary + address (sticky) ────────────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <MealPlanSummary pets={pets ?? []} plan={plan} recipesById={recipesById} costs={costs} total={total} isPricing={isPricing} />

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
              {!hasRegisteredAddress && (
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {t("save_address_to_account")}
                </label>
              )}
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
            disabled={isCreating || isPricing}
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
              : `${t("confirm_order")}${plan.length > 0 ? ` (${plan.length})` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
