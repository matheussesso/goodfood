"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck,
  RefreshCw,
  Dog,
  Cat,
  UtensilsCrossed,
  Loader2,
  Search,
  Users,
  PauseCircle,
  PlayCircle,
  XCircle,
  Filter,
  FilterX,
  DollarSign,
  CalendarDays,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";

type SubStatus = "active" | "paused" | "cancelled";

/**
 * Renders the plan's weekly recipes as a compact chip list, ordered by week.
 *
 * @param recipes - The subscription's weekly recipes, ordered by pivot.position.
 * @param t - Subscriptions namespace translator.
 * @returns The weekly recipe chip list element.
 */
function RotationChips({ recipes, t }: { recipes: Subscription["recipes"]; t: ReturnType<typeof useTranslations> }) {
  const ordered = [...(recipes ?? [])].sort((a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0));

  if (ordered.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ordered.map((recipe, index) => (
        <span
          key={`${recipe.id}-${index}`}
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
        >
          {t("rotation_order", { n: String(index + 1) })}: {recipe.name}
        </span>
      ))}
    </div>
  );
}

/** Formats a plan's week progress, e.g. "Semana 2 de 4", or null if not applicable. */
function weekProgressLabel(sub: Subscription, t: ReturnType<typeof useTranslations>): string | null {
  if (sub.current_cycle_index === null || sub.current_cycle_index === undefined) return null;
  if (!sub.total_cycles) return null;
  return t("current_week_progress", { current: String(sub.current_cycle_index + 1), total: String(sub.total_cycles) });
}

const STATUS_STYLE: Record<SubStatus, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

/**
 * Admin subscriptions management page.
 * Lists all customer subscriptions (weekly meal plans) with filtering by status and search.
 * Supports card and list view modes.
 * Allows admins to pause, resume, or cancel any subscription.
 *
 * @returns The admin subscriptions page element.
 */
export default function AdminSubscriptionsPage() {
  const t = useTranslations("Subscriptions");
  const tCommon = useTranslations("Common");

  const { subscriptions, isLoading, updateSubscription, isUpdating } = useSubscriptions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = useMemo<Subscription[]>(() => {
    if (!subscriptions) return [];
    const q = search.toLowerCase();
    return subscriptions.filter((s) => {
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchSearch =
        !q ||
        s.pet?.name?.toLowerCase().includes(q) ||
        s.recipes?.some((r) => r.name?.toLowerCase().includes(q)) ||
        s.user?.name?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [subscriptions, search, statusFilter]);

  const hasSubscriptions = !!(subscriptions && subscriptions.length > 0);
  const hasFilters = search !== "" || statusFilter !== "all";

  /**
   * Updates a subscription's status and shows a feedback banner.
   *
   * @param sub - The subscription to update.
   * @param status - The new status to set.
   */
  async function handleStatusChange(sub: Subscription, status: SubStatus) {
    if (status === "cancelled" && !confirm(t("cancel_confirm"))) return;
    setUpdatingId(sub.id);
    try {
      await updateSubscription({ id: sub.id, status });
      setFeedback({ type: "success", message: t("status_updated") });
    } catch {
      setFeedback({ type: "error", message: t("error_update") });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  const viewToggleLabels = { grid: tCommon("grid"), list: tCommon("list") };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-primary" />
            {t("admin_title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("admin_description")}</p>
        </div>
      </div>

      {/* ── Feedback banner ────────────────────────────────────────── */}
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

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {(["all", "active", "paused", "cancelled"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setStatusFilter(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                statusFilter === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {v === "all" ? t("all_statuses") : t(`status_${v}` as `status_${SubStatus}`)}
            </button>
          ))}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="gap-1.5 text-muted-foreground h-8"
            >
              <FilterX className="w-3.5 h-3.5" />
              {tCommon("clear_filters")}
            </Button>
          )}
        </div>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} />
      </div>

      {/* ── Mobile view toggle ─────────────────────────────────────── */}
      <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} mobile />

      {/* ── Results count ──────────────────────────────────────────── */}
      {!isLoading && hasSubscriptions && (
        <p className="text-sm text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? t("subscriptions_found_singular") : t("subscriptions_found_plural")}
        </p>
      )}

      {/* ── Content ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground bg-card border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">{tCommon("loading")}</span>
        </div>
      ) : !hasSubscriptions ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground">{t("no_subscriptions")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-xl gap-3 text-center px-6">
          <p className="font-semibold text-foreground">{tCommon("no_results")}</p>
          {hasFilters && <p className="text-sm text-muted-foreground">{tCommon("adjust_filters")}</p>}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((sub) => (
            <AdminSubscriptionCard
              key={sub.id}
              sub={sub}
              t={t}
              tCommon={tCommon}
              isUpdating={updatingId === sub.id && isUpdating}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          {/* Table header — desktop only */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_100px_90px_140px_160px] gap-4 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t("customer")}</span>
            <span className="flex items-center gap-1.5"><Dog className="w-3.5 h-3.5" />{t("pet")}</span>
            <span className="flex items-center gap-1.5"><UtensilsCrossed className="w-3.5 h-3.5" />{t("recipe")}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{t("duration_days")}</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{t("estimated_price")}</span>
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" />{t("total_cycles_label")}</span>
            <span>{tCommon("status")}</span>
          </div>

          <div className="divide-y divide-border/50">
            {filtered.map((sub) => (
              <AdminSubscriptionRow
                key={sub.id}
                sub={sub}
                t={t}
                tCommon={tCommon}
                isUpdating={updatingId === sub.id && isUpdating}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminSubRowProps {
  sub: Subscription;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  isUpdating: boolean;
  onStatusChange: (sub: Subscription, status: SubStatus) => void;
}

/**
 * Card displaying a single subscription in the admin card view.
 * Shows customer, pet, weekly recipes, duration, total cost, week progress and action buttons.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param isUpdating - Whether an update is in progress for this card.
 * @param onStatusChange - Callback to update subscription status.
 * @returns An admin subscription card element.
 */
function AdminSubscriptionCard({ sub, t, isUpdating, onStatusChange }: AdminSubRowProps) {
  const status = sub.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const customerName = sub.user?.name ?? "—";
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);

  const startDate = sub.start_date
    ? new Date(sub.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className={cn(
      "bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/30 transition-colors flex flex-col",
      status === "cancelled" && "opacity-60"
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="p-4 border-b">
        {/* Customer + status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground line-clamp-1">{customerName}</span>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0",
            style.badge
          )}>
            <span className={cn("w-1 h-1 rounded-full", style.dot)} />
            {t(`status_${status}` as `status_${SubStatus}`)}
          </span>
        </div>

        {/* Pet + recipes */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <PetIcon className="w-3 h-3" />
          </div>
          <span className="text-sm text-foreground line-clamp-1 font-medium">{sub.pet?.name ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <UtensilsCrossed className="w-3 h-3 shrink-0" />
          <RotationChips recipes={sub.recipes} t={t} />
        </div>

        {/* Price + duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{sub.duration_days}d · {sub.total_cycles ?? "—"} {t("weeks_count_plural")}</span>
        </div>
      </div>

      {/* ── Info grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 p-4 flex-1">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />{t("start_date")}
          </p>
          <p className="text-xs font-medium text-foreground">{startDate}</p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Layers className="w-3 h-3" />{t("total_cycles_label")}
          </p>
          <p className="text-xs font-medium text-foreground">{progress ?? "—"}</p>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────── */}
      {status !== "cancelled" && (
        <div className="flex items-center gap-1 px-4 pb-4 pt-1 border-t border-border/50">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <>
              {status === "active" ? (
                <button
                  type="button"
                  title={t("pause_subscription")}
                  onClick={() => onStatusChange(sub, "paused")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors text-xs font-medium"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  {t("pause_subscription")}
                </button>
              ) : (
                <button
                  type="button"
                  title={t("resume_subscription")}
                  onClick={() => onStatusChange(sub, "active")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors text-xs font-medium"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {t("resume_subscription")}
                </button>
              )}
              <button
                type="button"
                title={t("cancel_subscription")}
                onClick={() => onStatusChange(sub, "cancelled")}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Table row for a single subscription in the admin list view.
 * Renders as a responsive grid on desktop and a stacked layout on mobile.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param tCommon - Common namespace translator.
 * @param isUpdating - Whether an update is in progress for this row.
 * @param onStatusChange - Callback to update subscription status.
 * @returns A subscription row element.
 */
function AdminSubscriptionRow({ sub, t, isUpdating, onStatusChange }: AdminSubRowProps) {
  const status = sub.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const customerName = sub.user?.name ?? "—";
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);

  return (
    <div className={cn(
      "flex flex-col md:grid md:grid-cols-[1fr_1fr_1fr_100px_90px_140px_160px] gap-3 md:gap-4 px-5 py-4 items-start md:items-center hover:bg-muted/20 transition-colors",
      status === "cancelled" && "opacity-60"
    )}>
      {/* Customer */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-foreground line-clamp-1">{customerName}</span>
      </div>

      {/* Pet */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <PetIcon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm text-foreground line-clamp-1">{sub.pet?.name ?? "—"}</span>
      </div>

      {/* Weekly recipes */}
      <div className="flex items-center gap-2 min-w-0">
        <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <RotationChips recipes={sub.recipes} t={t} />
      </div>

      {/* Duration */}
      <div className="text-sm text-foreground">{sub.duration_days}d</div>

      {/* Estimated price */}
      <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
        R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Week progress */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Layers className="w-3.5 h-3.5 shrink-0" />
        <span>{progress ?? "—"}</span>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
          style.badge
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
          {t(`status_${status}` as `status_${SubStatus}`)}
        </span>

        {status !== "cancelled" && (
          isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center gap-1">
              {status === "active" ? (
                <button
                  type="button"
                  title={t("pause_subscription")}
                  onClick={() => onStatusChange(sub, "paused")}
                  className="p-1.5 rounded text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  title={t("resume_subscription")}
                  onClick={() => onStatusChange(sub, "active")}
                  className="p-1.5 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                title={t("cancel_subscription")}
                onClick={() => onStatusChange(sub, "cancelled")}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
