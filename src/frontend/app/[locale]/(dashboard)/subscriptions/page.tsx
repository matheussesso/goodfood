"use client";

import { useState } from "react";
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
  Clock,
  PauseCircle,
  PlayCircle,
  XCircle,
  Search,
  Filter,
  FilterX,
  LayoutGrid,
  List as ListIcon,
  Repeat2,
  Package,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubStatus = "active" | "paused" | "cancelled";

/**
 * Returns a human-readable frequency label based on recipe duration_days.
 *
 * @param durationDays - The recipe's duration in days.
 * @param t - Subscriptions namespace translator.
 */
function frequencyLabel(durationDays: number | undefined, t: ReturnType<typeof useTranslations>): string {
  if (!durationDays) return t("frequency_monthly");
  if (durationDays <= 7)  return t("frequency_weekly");
  if (durationDays <= 14) return t("frequency_biweekly");
  if (durationDays <= 31) return t("frequency_monthly");
  return t("frequency_custom", { days: durationDays });
}

const STATUS_STYLE: Record<SubStatus, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

/**
 * Customer-facing subscriptions page.
 * Lists all auto-replenishment subscriptions and allows pausing, resuming, or cancelling.
 * Supports card and list view modes.
 *
 * @returns The subscriptions management page element.
 */
export default function SubscriptionsPage() {
  const t = useTranslations("Subscriptions");
  const tCommon = useTranslations("Common");

  const { subscriptions, isLoading, updateSubscription, isUpdating } = useSubscriptions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = (subscriptions ?? []).filter((s) => {
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.pet?.name?.toLowerCase().includes(q) ||
      s.recipe?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

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

  /**
   * Renders the desktop/mobile view mode toggle buttons.
   *
   * @param mobile - When true, renders full-width mobile variant.
   * @returns The toggle button group element.
   */
  const ViewToggle = ({ mobile }: { mobile?: boolean }) => (
    <div className={cn("flex border rounded-md h-10 shrink-0", mobile ? "w-full sm:hidden" : "hidden sm:flex")}>
      <button
        type="button"
        onClick={() => setViewMode("card")}
        className={cn(
          "flex items-center justify-center gap-2 px-3 transition-colors rounded-l-md",
          mobile && "flex-1",
          viewMode === "card" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        {mobile && <span className="text-sm">{tCommon("grid")}</span>}
      </button>
      <button
        type="button"
        onClick={() => setViewMode("list")}
        className={cn(
          "flex items-center justify-center gap-2 px-3 transition-colors rounded-r-md",
          mobile && "flex-1",
          viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
        )}
      >
        <ListIcon className="w-4 h-4" />
        {mobile && <span className="text-sm">{tCommon("list")}</span>}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
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
        <ViewToggle />
      </div>

      {/* ── Mobile view toggle ─────────────────────────────────────── */}
      <ViewToggle mobile />

      {/* ── Results count ──────────────────────────────────────────── */}
      {hasSubscriptions && (
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
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("no_subscriptions")}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{t("no_subscriptions_desc")}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-xl gap-3 text-center px-6">
          <p className="font-semibold text-foreground">{tCommon("no_results")}</p>
          {hasFilters && <p className="text-sm text-muted-foreground">{tCommon("adjust_filters")}</p>}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              t={t}
              isUpdating={updatingId === sub.id && isUpdating}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-border/50">
            {filtered.map((sub) => (
              <SubscriptionRow
                key={sub.id}
                sub={sub}
                t={t}
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

interface SubscriptionCardProps {
  sub: Subscription;
  t: ReturnType<typeof useTranslations>;
  isUpdating: boolean;
  onStatusChange: (sub: Subscription, status: SubStatus) => void;
}

/**
 * Card displaying a single subscription with full details: pet, recipe, frequency,
 * estimated price, orders count, last order date, next delivery date and action buttons.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param isUpdating - Whether an update is in progress for this card.
 * @param onStatusChange - Callback to update subscription status.
 * @returns A subscription card element.
 */
function SubscriptionCard({ sub, t, isUpdating, onStatusChange }: SubscriptionCardProps) {
  const status = sub.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;

  const nextDate = sub.next_delivery_date
    ? new Date(sub.next_delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const daysUntilNext = sub.next_delivery_date
    ? Math.max(0, Math.ceil((new Date(sub.next_delivery_date).getTime() - Date.now()) / 86_400_000))
    : null;

  const startDate = sub.start_date
    ? new Date(sub.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const lastOrderDate = sub.orders_max_created_at
    ? new Date(sub.orders_max_created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const frequency = frequencyLabel(sub.recipe?.duration_days, t);
  const estimatedPrice = sub.estimated_price ?? 0;

  return (
    <div className={cn(
      "bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/30 transition-colors flex flex-col",
      status === "cancelled" && "opacity-60"
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PetIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm line-clamp-1">{sub.pet?.name ?? "—"}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <UtensilsCrossed className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{sub.recipe?.name ?? "—"}</span>
              </p>
            </div>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
            style.badge
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
            {t(`status_${status}` as `status_${SubStatus}`)}
          </span>
        </div>

        {/* Price + frequency */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground">{t("per_cycle")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat2 className="w-3 h-3 shrink-0" />
            <span className="font-medium">{frequency}</span>
          </div>
        </div>
      </div>

      {/* ── Info grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 p-4 flex-1">
        {/* Next delivery */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t("next_delivery")}
          </p>
          {nextDate && status !== "cancelled" ? (
            <div>
              <p className="text-xs font-medium text-foreground">{nextDate}</p>
              {daysUntilNext !== null && (
                <p className="text-[10px] text-muted-foreground">{daysUntilNext} {t("days_until_next")}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>

        {/* Orders count */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Package className="w-3 h-3" /> {t("total_orders")}
          </p>
          <p className="text-xs font-medium text-foreground">
            {sub.orders_count ?? 0} {t("orders_delivered")}
          </p>
          {lastOrderDate && (
            <p className="text-[10px] text-muted-foreground">{t("last_order")}: {lastOrderDate}</p>
          )}
        </div>

        {/* Start date */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> {t("start_date")}
          </p>
          <p className="text-xs font-medium text-foreground">{startDate ?? "—"}</p>
        </div>

        {/* Recipe duration */}
        {sub.recipe?.duration_days && (
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t("duration_days")}
            </p>
            <p className="text-xs font-medium text-foreground">{sub.recipe.duration_days} dias</p>
          </div>
        )}
      </div>

      {/* ── Actions ────────────────────────────────────────── */}
      {status !== "cancelled" && (
        <div className="flex items-center gap-2 px-4 pb-4">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
          ) : status === "active" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "paused")}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                {t("pause_subscription")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "cancelled")}
              >
                <XCircle className="w-3.5 h-3.5" />
                {t("cancel_subscription")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "active")}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                {t("resume_subscription")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-3"
                onClick={() => onStatusChange(sub, "cancelled")}
              >
                <XCircle className="w-3.5 h-3.5" />
                {t("cancel_subscription")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact list row for a single subscription in list view mode.
 * Shows pet, recipe, price, frequency, next delivery and action icons.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param isUpdating - Whether an update is in progress for this row.
 * @param onStatusChange - Callback to update subscription status.
 * @returns A subscription list row element.
 */
function SubscriptionRow({ sub, t, isUpdating, onStatusChange }: SubscriptionCardProps) {
  const status = sub.status as SubStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const frequency = frequencyLabel(sub.recipe?.duration_days, t);
  const estimatedPrice = sub.estimated_price ?? 0;

  const nextDate = sub.next_delivery_date
    ? new Date(sub.next_delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const lastOrderDate = sub.orders_max_created_at
    ? new Date(sub.orders_max_created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors",
      status === "cancelled" && "opacity-60"
    )}>
      {/* Pet avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <PetIcon className="w-4 h-4" />
      </div>

      {/* Pet + recipe + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground line-clamp-1">{sub.pet?.name ?? "—"}</span>
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
            style.badge
          )}>
            <span className={cn("w-1 h-1 rounded-full", style.dot)} />
            {t(`status_${status}` as `status_${SubStatus}`)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1 min-w-0">
            <UtensilsCrossed className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">{sub.recipe?.name ?? "—"}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0 text-amber-600 dark:text-amber-400 font-semibold">
            R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Repeat2 className="w-3 h-3" />{frequency}
          </span>
          {status !== "cancelled" && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />{nextDate}
            </span>
          )}
          {lastOrderDate && (
            <span className="flex items-center gap-1 shrink-0 text-muted-foreground/70">
              <Package className="w-3 h-3" />{sub.orders_count ?? 0} • {t("last_order")}: {lastOrderDate}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {status !== "cancelled" && (
        <div className="flex items-center gap-1 shrink-0">
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : status === "active" ? (
            <>
              <button
                type="button"
                title={t("pause_subscription")}
                onClick={() => onStatusChange(sub, "paused")}
                className="p-1.5 rounded text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={t("cancel_subscription")}
                onClick={() => onStatusChange(sub, "cancelled")}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                title={t("resume_subscription")}
                onClick={() => onStatusChange(sub, "active")}
                className="p-1.5 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
              </button>
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
