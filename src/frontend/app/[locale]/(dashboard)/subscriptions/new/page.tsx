"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePets } from "@/hooks/usePets";
import { useRecipeCycleCostTotal } from "@/hooks/useRecipeCycleCost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DurationStepper } from "@/features/subscriptions/components/DurationStepper";
import { WeeklyRecipePicker } from "@/features/subscriptions/components/WeeklyRecipePicker";
import {
  ArrowLeft,
  CalendarCheck,
  Dog,
  Cat,
  Loader2,
  PartyPopper,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_DURATION_DAYS = 14;

/**
 * Dedicated page for creating a new subscription: a fixed-duration weekly
 * meal plan for a single pet, with one recipe chosen per 7-day block.
 *
 * @returns The new subscription creation page element.
 */
export default function NewSubscriptionPage() {
  const t = useTranslations("Subscriptions");
  const tCommon = useTranslations("Common");
  const tPets = useTranslations("Pets");

  const router = useRouter();
  const { pets, isLoading: petsLoading } = usePets();
  const { createSubscription, isCreating } = useSubscriptions();

  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState(MIN_DURATION_DAYS);
  const [recipeIds, setRecipeIds] = useState<(number | null)[]>(
    Array(MIN_DURATION_DAYS / 7).fill(null)
  );
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<number | null>(null);

  const totalWeeks = durationDays / 7;

  const selectedPet = pets?.find((p) => p.id === selectedPetId);
  const petRecipeOptions = (selectedPet?.recipes ?? []).filter((r) => !r.is_template);

  const selectedRecipes = recipeIds.map((id) => petRecipeOptions.find((r) => r.id === id));
  const { total: totalCost, isLoading: isCostLoading } = useRecipeCycleCostTotal(selectedRecipes);

  /** Auto-redirect to /subscriptions 3s after successful creation. */
  useEffect(() => {
    if (confirmedId === null) return;
    const timer = setTimeout(() => router.push("/subscriptions"), 3000);
    return () => clearTimeout(timer);
  }, [confirmedId, router]);

  /** Resizes the recipeIds array to match the current week count, keeping already-chosen recipes. */
  function handleDurationChange(days: number) {
    setDurationDays(days);
    const weeks = days / 7;
    setRecipeIds((prev) => {
      const next = prev.slice(0, weeks);
      while (next.length < weeks) next.push(null);
      return next;
    });
    setErrors((prev) => ({ ...prev, recipeIds: "" }));
  }

  function handlePetChange(petId: number) {
    setSelectedPetId(petId);
    setRecipeIds(Array(totalWeeks).fill(null));
    setErrors((prev) => ({ ...prev, petId: "" }));
  }

  function handleRecipeChange(weekIndex: number, recipeId: number) {
    setRecipeIds((prev) => {
      const next = [...prev];
      next[weekIndex] = recipeId;
      return next;
    });
    setErrors((prev) => ({ ...prev, recipeIds: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!selectedPetId) newErrors.petId = t("error_pet_required");
    if (recipeIds.some((id) => !id)) newErrors.recipeIds = t("error_recipe_required");
    if (!startDate) newErrors.startDate = t("error_start_date_required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !selectedPetId) return;
    setSubmitError(null);
    try {
      const result = await createSubscription({
        pet_id: selectedPetId,
        recipe_ids: recipeIds as number[],
        start_date: startDate,
        duration_days: durationDays,
      });
      setConfirmedId(result?.data?.id ?? null);
    } catch {
      setSubmitError(t("error_update"));
    }
  }

  /* ── Success screen ──────────────────────────────────────────────── */
  if (confirmedId !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-bounce">
          <PartyPopper className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("create_subscription")}</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">{t("subscription_created_success")}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Link href="/subscriptions">
            <Button size="lg" className="gap-2">
              <CalendarCheck className="w-5 h-5" />
              {t("title")}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {tCommon("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          href="/subscriptions"
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck className="w-6 h-6 text-primary" />
            {t("create_subscription")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("new_subscription_desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: pet, duration, weekly recipes ─────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pet picker */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">{t("select_pet")}</h2>
            </div>
            <div className="p-4">
              {petsLoading ? (
                <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !pets || pets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground text-center">
                  <Dog className="w-8 h-8 opacity-30" />
                  <p className="text-sm">{tPets("no_pets")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pets.map((pet) => {
                    const PetIcon = pet.type === "cat" ? Cat : Dog;
                    const sel = selectedPetId === pet.id;
                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => handlePetChange(pet.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-lg border-1 transition-colors",
                          sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          sel ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <PetIcon className="w-5 h-5" />
                        </div>
                        <span className={cn("text-sm font-medium truncate max-w-full", sel ? "text-primary" : "text-foreground")}>
                          {pet.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.petId && <p className="text-xs text-destructive mt-2">{errors.petId}</p>}
            </div>
          </div>

          {/* Duration */}
          {selectedPetId && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20">
                <h2 className="font-semibold text-foreground">{t("duration_days")}</h2>
              </div>
              <div className="p-4">
                <DurationStepper value={durationDays} onChange={handleDurationChange} t={t} />
                <p className="text-xs text-muted-foreground mt-2">{t("duration_stepper_hint")}</p>
              </div>
            </div>
          )}

          {/* Weekly recipes */}
          {selectedPetId && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20">
                <h2 className="font-semibold text-foreground">{t("select_recipes")}</h2>
              </div>
              <div className="p-4">
                <WeeklyRecipePicker
                  totalWeeks={totalWeeks}
                  recipeIds={recipeIds}
                  options={petRecipeOptions}
                  onChange={handleRecipeChange}
                  t={t}
                />
                {errors.recipeIds && <p className="text-xs text-destructive mt-2">{errors.recipeIds}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: summary + start date + submit (sticky) ───────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">{t("estimated_price")}</h2>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("total_cycles_label")}</span>
              <span className="text-sm font-medium text-foreground">{totalWeeks}</span>
            </div>
            <div className="px-5 py-4 border-t bg-muted/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("estimated_price")}</span>
              <span className="text-2xl font-bold text-primary flex items-center gap-2">
                {isCostLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                {t("start_date_label")}
              </h2>
            </div>
            <div className="px-5 py-4">
              <Label htmlFor="sub_start_date" className="sr-only">{t("start_date_label")}</Label>
              <Input
                id="sub_start_date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: "" })); }}
                className={errors.startDate ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.startDate && <p className="text-xs text-destructive mt-1.5">{errors.startDate}</p>}
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {submitError}
            </p>
          )}

          <Button onClick={handleSubmit} disabled={isCreating} className="w-full gap-2" size="lg">
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarCheck className="w-5 h-5" />}
            {isCreating ? tCommon("saving") : t("create_subscription")}
          </Button>
        </div>
      </div>
    </div>
  );
}
