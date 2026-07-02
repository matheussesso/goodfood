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
  Clock,
  Search,
  Users,
  PauseCircle,
  PlayCircle,
  XCircle,
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
 * Renders the ordered recipe rotation as a compact chip list.
 *
 * @param recipes - The subscription's recipe rotation, ordered by pivot.position.
 * @param t - Subscriptions namespace translator.
 * @returns The rotation chip list element.
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

const STATUS_STYLE: Record<SubStatus, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

/**
 * Admin subscriptions management page.
 * Lists all customer subscriptions with filtering by status and search.
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
        <ViewToggle />
      </div>

      {/* ── Mobile view toggle ─────────────────────────────────────── */}
      <ViewToggle mobile />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_120px_110px_160px_160px] gap-4 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t("customer")}</span>
            <span className="flex items-center gap-1.5"><Dog className="w-3.5 h-3.5" />{t("pet")}</span>
            <span className="flex items-center gap-1.5"><UtensilsCrossed className="w-3.5 h-3.5" />{t("recipe")}</span>
            <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{t("estimated_price")}</span>
            <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />{t("total_orders")}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{t("next_delivery")}</span>
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
 * Shows customer, pet, recipe, next delivery date, status badge and action buttons.
 *
 * @param sub - The subscription data.
 * @param t - Subscriptions namespace translator.
 * @param tCommon - Common namespace translator (unused directly, passed for interface compatibility).
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

  const nextDate = sub.next_delivery_date
    ? new Date(sub.next_delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const startDate = sub.start_date
    ? new Date(sub.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const lastOrderDate = sub.orders_max_created_at
    ? new Date(sub.orders_max_created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

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

        {/* Pet + recipe */}
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

        {/* Price + cadence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-muted-foreground">{t("per_cycle")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Repeat2 className="w-3 h-3" />
            <span className="font-medium">{t("cadence_label", { days: String(sub.interval_days) })}</span>
          </div>
        </div>
      </div>

      {/* ── Info grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 p-4 flex-1">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" />{t("next_delivery")}
          </p>
          <p className="text-xs font-medium text-foreground">{nextDate}</p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Package className="w-3 h-3" />{t("total_orders")}
          </p>
          <p className="text-xs font-medium text-foreground">
            {sub.orders_count ?? 0} {t("orders_delivered")}
          </p>
          {lastOrderDate && (
            <p className="text-[10px] text-muted-foreground">{t("last_order")}: {lastOrderDate}</p>
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />{t("start_date")}
          </p>
          <p className="text-xs font-medium text-foreground">{startDate}</p>
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

  const nextDate = sub.next_delivery_date
    ? new Date(sub.next_delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const lastOrderDate = sub.orders_max_created_at
    ? new Date(sub.orders_max_created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className={cn(
      "flex flex-col md:grid md:grid-cols-[1fr_1fr_1fr_120px_110px_160px_160px] gap-3 md:gap-4 px-5 py-4 items-start md:items-center hover:bg-muted/20 transition-colors",
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

      {/* Recipe rotation */}
      <div className="flex items-center gap-2 min-w-0">
        <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <RotationChips recipes={sub.recipes} t={t} />
      </div>

      {/* Estimated price */}
      <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
        R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Orders count */}
      <div className="text-sm text-foreground">
        <span className="font-medium">{sub.orders_count ?? 0}</span>
        {lastOrderDate && (
          <p className="text-[11px] text-muted-foreground">{lastOrderDate}</p>
        )}
      </div>

      {/* Next delivery */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{nextDate}</span>
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
