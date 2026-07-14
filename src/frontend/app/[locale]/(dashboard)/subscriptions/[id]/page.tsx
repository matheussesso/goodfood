"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  CalendarCheck,
  CalendarDays,
  DollarSign,
  Layers,
  UtensilsCrossed,
  Dog,
  Cat,
  Loader2,
  Info,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle,
  Salad,
} from "lucide-react";
import { useSubscription, useSubscriptions, SubscriptionRecipe } from "@/hooks/useSubscriptions";
import { useRecipeCycleCost, CYCLE_DAYS } from "@/hooks/useRecipeCycleCost";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubStatus = "active" | "paused" | "cancelled";

const STATUS_STYLE: Record<SubStatus, { badge: string; dot: string; bar: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400",  bar: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400",    bar: "bg-red-400" },
};

/**
 * Detail card for a single week's recipe: description, species, portions,
 * live 7-day cycle cost, and full ingredient composition (quantity + unit).
 *
 * @param recipe - The recipe assigned to this week.
 * @param weekIndex - 0-indexed week number, for the "Semana N" label.
 * @param t - Subscriptions namespace translator.
 * @param tRec - Recipes namespace translator.
 * @param tCat - Catalog namespace translator.
 */
function WeeklyRecipeDetailCard({
  recipe,
  weekIndex,
  t,
  tRec,
  tCat,
}: {
  recipe: SubscriptionRecipe;
  weekIndex: number;
  t: ReturnType<typeof useTranslations>;
  tRec: ReturnType<typeof useTranslations>;
  tCat: ReturnType<typeof useTranslations>;
}) {
  const { data: cost, isLoading: isCostLoading } = useRecipeCycleCost(recipe);
  const ingredients = recipe.ingredients ?? [];
  const speciesLabel = recipe.pet_type === "cat" ? tCat("cat") : recipe.pet_type === "dog" ? tCat("dog") : tCat("general");

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group border-b"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              {t("rotation_order", { n: String(weekIndex + 1) })}
            </p>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {recipe.name}
            </p>
          </div>
        </div>
      </Link>

      <div className="px-4 py-3 space-y-3">
        {recipe.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{recipe.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("pet_type")}</span>
            <span className="font-medium text-xs truncate block">{speciesLabel}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("duration_days")}</span>
            <span className="font-medium text-xs truncate block">{CYCLE_DAYS}d</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{tRec("portions_per_day_caps").split("/")[0]}</span>
            <span className="font-medium text-xs truncate flex items-center justify-center gap-1">
              <Salad className="w-3 h-3 shrink-0" />{recipe.daily_portions ?? 1}x
            </span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("estimated_price")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate flex items-center justify-center gap-1">
              {isCostLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                `R$ ${(cost?.estimatedCost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </span>
          </div>
        </div>

        {/* Composition */}
        {ingredients.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {tRec("recipe_composition")} ({ingredients.length})
            </p>
            <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {ingredients.map((ing) => (
                <li key={ing.id} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="text-muted-foreground truncate flex-1">{ing.name}</span>
                  <span className="font-medium shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {ing.pivot.quantity} {ing.pivot.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Customer-facing subscription detail page.
 * Shows the week-by-week progress of the plan, each week's recipe with its
 * composition, plan summary, linked pet, and pause/resume/cancel actions.
 *
 * @returns The subscription detail page element.
 */
export default function SubscriptionDetailPage() {
  const t = useTranslations("Subscriptions");
  const tRec = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { subscription, isLoading, error } = useSubscription(id);
  const { updateSubscription, isUpdating } = useSubscriptions();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  /**
   * Updates the plan's status and shows a feedback banner.
   *
   * @param status - The new status to set.
   */
  async function handleStatusChange(status: SubStatus) {
    if (!subscription) return;
    if (status === "cancelled" && !confirm(t("cancel_confirm"))) return;
    try {
      await updateSubscription({ id: subscription.id, status });
      setFeedback({ type: "success", message: t("status_updated") });
    } catch {
      setFeedback({ type: "error", message: t("error_update") });
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">{tCommon("loading")}</span>
      </div>
    );
  }

  if (!subscription || error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <CalendarCheck className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("subscription_not_found")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t("subscription_not_found_desc")}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {tCommon("back")}
        </Button>
      </div>
    );
  }

  const status = subscription.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const isCancelled = status === "cancelled";
  const PetIcon = subscription.pet?.type === "cat" ? Cat : Dog;
  const totalWeeks = subscription.total_cycles ?? 0;
  const currentWeek = subscription.current_cycle_index;
  const orderedRecipes = [...(subscription.recipes ?? [])].sort(
    (a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0)
  );

  const startDate = subscription.start_date
    ? new Date(subscription.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <PetIcon className="w-6 h-6 text-primary" />
                {subscription.pet?.name ?? "—"}
              </h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", style.badge)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
                {t(`status_${status}` as `status_${SubStatus}`)}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {t("start_date")}: {startDate}
            </p>
          </div>
        </div>

        {!isCancelled && (
          <Link href={`/subscriptions/${subscription.id}/edit`}>
            <Button variant="secondary" className="gap-2">
              <Edit className="w-4 h-4" /> {tCommon("edit")}
            </Button>
          </Link>
        )}
      </div>

      {/* ── Feedback banner ───────────────────────────────────────────── */}
      {feedback && (
        <div className={cn(
          "px-4 py-3 rounded-lg text-sm font-medium border",
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        )}>
          {feedback.message}
        </div>
      )}

      {/* ── Quick stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarDays, label: t("duration_days"), value: `${subscription.duration_days}d`, color: "text-primary bg-primary/10" },
          { icon: Layers, label: t("total_cycles_label"), value: String(totalWeeks), color: "text-violet-600 bg-violet-500/10" },
          {
            icon: DollarSign,
            label: t("estimated_price"),
            value: `R$ ${(subscription.estimated_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: "text-amber-600 bg-amber-500/10",
          },
          { icon: CalendarCheck, label: tCommon("status"), value: t(`status_${status}` as `status_${SubStatus}`), color: "text-blue-600 bg-blue-500/10" },
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
          {/* Week progress timeline */}
          {!isCancelled ? (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("total_cycles_label")}</h3>
                {currentWeek !== null && currentWeek !== undefined && (
                  <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {t("current_week_progress", { current: String(currentWeek + 1), total: String(totalWeeks) })}
                  </span>
                )}
              </div>
              <div className="px-5 py-7 overflow-x-auto">
                <div className="flex items-start min-w-max">
                  {Array.from({ length: totalWeeks }, (_, idx) => {
                    const done = currentWeek !== null && currentWeek !== undefined && idx < currentWeek;
                    const current = currentWeek === idx;
                    return (
                      <div key={idx} className="flex-1 min-w-[64px] flex flex-col items-center relative">
                        {idx > 0 && (
                          <div
                            className={cn(
                              "absolute top-3.5 right-1/2 w-full h-0.5 transition-colors",
                              done || current ? style.bar : "bg-border"
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                            done
                              ? `${style.bar} border-transparent`
                              : current
                              ? "bg-background border-primary"
                              : "bg-background border-border"
                          )}
                        >
                          {done ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : current ? (
                            <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse", style.dot)} />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-border" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[10px] text-center mt-2 font-medium leading-tight px-1",
                            current ? "text-foreground font-semibold" : done ? "text-muted-foreground" : "text-muted-foreground/40"
                          )}
                        >
                          {t("rotation_order", { n: String(idx + 1) })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t("status_cancelled")}</p>
            </div>
          )}

          {/* Weekly recipes */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("select_recipes")}</h3>
              <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {orderedRecipes.length} {orderedRecipes.length === 1 ? t("weeks_count") : t("weeks_count_plural")}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {orderedRecipes.length > 0 ? (
                orderedRecipes.map((recipe, idx) => (
                  <WeeklyRecipeDetailCard
                    key={`${recipe.id}-${idx}`}
                    recipe={recipe}
                    weekIndex={idx}
                    t={t}
                    tRec={tRec}
                    tCat={tCat}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">—</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Plan summary */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{tCommon("details")}</h3>
            </div>
            <div className="divide-y divide-border/50 text-sm">
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("start_date")}</span>
                <span className="font-medium text-foreground">{startDate}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("duration_days")}</span>
                <span className="font-medium text-foreground">{subscription.duration_days} dias</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("total_cycles_label")}</span>
                <span className="font-medium text-foreground">{totalWeeks}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <span className="font-semibold text-foreground">{t("estimated_price")}</span>
                <span className="text-xl font-bold text-primary">
                  R$ {(subscription.estimated_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Linked pet */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <PetIcon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("pet")}</h3>
            </div>
            <div className="p-4">
              {subscription.pet ? (
                <Link
                  href={`/pets/${subscription.pet.id}`}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <PetIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {subscription.pet.name}
                    </p>
                    {subscription.pet.breed && (
                      <p className="text-xs text-muted-foreground truncate">{subscription.pet.breed}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground italic">—</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isCancelled && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex flex-col gap-2">
                {isUpdating ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : status === "active" ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    onClick={() => handleStatusChange("paused")}
                  >
                    <PauseCircle className="w-4 h-4" /> {t("pause_subscription")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    onClick={() => handleStatusChange("active")}
                  >
                    <PlayCircle className="w-4 h-4" /> {t("resume_subscription")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleStatusChange("cancelled")}
                >
                  <XCircle className="w-4 h-4" /> {t("cancel_subscription")}
                </Button>
              </div>
            </div>
          )}

          {/* Edit CTA */}
          {!isCancelled && (
            <Link href={`/subscriptions/${subscription.id}/edit`} className="block">
              <Button className="w-full gap-2" variant="secondary">
                <Edit className="w-4 h-4" /> {tCommon("edit")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
