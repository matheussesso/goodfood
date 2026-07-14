"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useSubscription, useSubscriptions } from "@/hooks/useSubscriptions";
import { usePets } from "@/hooks/usePets";
import { useRecipeCycleCostTotal } from "@/hooks/useRecipeCycleCost";
import { Button } from "@/components/ui/button";
import { DurationStepper } from "@/features/subscriptions/components/DurationStepper";
import { WeeklyRecipePicker } from "@/features/subscriptions/components/WeeklyRecipePicker";
import {
  ArrowLeft,
  CalendarCheck,
  Dog,
  Cat,
  Loader2,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

/**
 * Dedicated page for editing an existing subscription's plan duration and
 * weekly recipes. The pet cannot be changed here — only the plan itself.
 *
 * @returns The subscription edit page element.
 */
export default function EditSubscriptionPage() {
  const params = useParams();
  const id = params.id as string;

  const t = useTranslations("Subscriptions");
  const tPets = useTranslations("Pets");
  const tCommon = useTranslations("Common");

  const router = useRouter();
  const { subscription, isLoading } = useSubscription(id);
  const { pets } = usePets();
  const { updateSubscription, isUpdating } = useSubscriptions();

  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [recipeIds, setRecipeIds] = useState<(number | null)[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Seed local form state from the fetched subscription. Adjusting state
   * during render (rather than in a useEffect) avoids an extra render pass —
   * this is React's recommended pattern for initializing state from a prop/query
   * that only becomes available after the first render.
   */
  const [seededForId, setSeededForId] = useState<number | null>(null);
  if (subscription && seededForId !== subscription.id) {
    setSeededForId(subscription.id);
    setDurationDays(subscription.duration_days);
    const ordered = [...(subscription.recipes ?? [])].sort(
      (a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0)
    );
    const weeks = subscription.duration_days / 7;
    setRecipeIds(Array.from({ length: weeks }, (_, i) => ordered[i]?.id ?? null));
  }

  const pet = pets?.find((p) => p.id === subscription?.pet_id);
  const petRecipeOptions = (pet?.recipes ?? []).filter((r) => !r.is_template);
  const totalWeeks = durationDays ? durationDays / 7 : 0;

  const selectedRecipes = recipeIds.map((recipeId) => petRecipeOptions.find((r) => r.id === recipeId));
  const { total: totalCost, isLoading: isCostLoading } = useRecipeCycleCostTotal(selectedRecipes);

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
    if (recipeIds.length === 0 || recipeIds.some((rid) => !rid)) {
      newErrors.recipeIds = t("error_recipe_required");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !durationDays || !subscription) return;
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await updateSubscription({
        id: subscription.id,
        duration_days: durationDays,
        recipe_ids: recipeIds as number[],
      });
      setSubmitSuccess(true);
      setTimeout(() => router.push("/subscriptions"), 1200);
    } catch {
      setSubmitError(t("error_update"));
    }
  }

  if (isLoading || durationDays === null) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm">{tCommon("loading")}</span>
      </div>
    );
  }

  const PetIcon = pet?.type === "cat" ? Cat : Dog;

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
            {t("edit_subscription_title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("edit_subscription_desc")}</p>
        </div>
      </div>

      {submitSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {t("subscription_updated_success")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left: pet (read-only), duration, weekly recipes ─────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">{t("pet")}</h2>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <PetIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{pet?.name ?? "—"}</p>
                {pet && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {pet.breed || tPets("no_breed")}{pet.weight ? ` · ${pet.weight}kg` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">{t("duration_days")}</h2>
            </div>
            <div className="p-4">
              <DurationStepper value={durationDays} onChange={handleDurationChange} t={t} />
              <p className="text-xs text-muted-foreground mt-2">{t("duration_stepper_hint")}</p>
            </div>
          </div>

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
        </div>

        {/* ── Right: summary + submit (sticky) ─────────────────────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                {t("total_cycles_label")}
              </h2>
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

          {submitError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Link href="/subscriptions" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                {tCommon("cancel")}
              </Button>
            </Link>
            <Button onClick={handleSubmit} disabled={isUpdating} className="flex-1 gap-2">
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? tCommon("saving") : tCommon("save_changes")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
