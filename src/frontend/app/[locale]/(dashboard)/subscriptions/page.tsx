"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck,
  RefreshCw,
  Dog,
  Cat,
  Loader2,
  PauseCircle,
  PlayCircle,
  XCircle,
  Search,
  Filter,
  CalendarDays,
  Plus,
  Edit2,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";

type SubStatus = "active" | "paused" | "cancelled";

const STATUS_STYLE: Record<SubStatus, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

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

/**
 * Customer-facing subscriptions page.
 * Lists the customer's weekly meal plans (pet + duration + one recipe per week),
 * with links to create or edit a plan, and pause/resume/cancel actions.
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
      s.recipes?.some((r) => r.name?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const countByStatus = (subscriptions ?? []).reduce<Record<string, number>>((counts, s) => {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
    return counts;
  }, {});

  const hasSubscriptions = !!(subscriptions && subscriptions.length > 0);
  const hasFilters = search !== "" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

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
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>
        </div>
        <Link href="/subscriptions/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            {t("create_subscription")}
          </Button>
        </Link>
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
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubStatus | "all")}
              className="h-10 flex-1 sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("all_statuses")} ({subscriptions?.length ?? 0})</option>
              {(["active", "paused", "cancelled"] as const).map((v) => (
                <option key={v} value={v}>
                  {t(`status_${v}` as `status_${SubStatus}`)} ({countByStatus[v] ?? 0})
                </option>
              ))}
            </select>
          </div>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} />
        </div>
      </div>

      {/* ── Mobile view toggle ─────────────────────────────────────── */}
      <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} mobile />

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
          <Link href="/subscriptions/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("create_subscription")}
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-xl gap-3 text-center px-6">
          <p className="font-semibold text-foreground">{tCommon("no_results")}</p>
          {hasFilters && <p className="text-sm text-muted-foreground">{tCommon("adjust_filters")}</p>}
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {tCommon("clear_filters")}
            </Button>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
 * Card displaying a single subscription: pet, weekly recipes, duration,
 * total plan cost, week progress, start date and action buttons.
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
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);

  const startDate = sub.start_date
    ? new Date(sub.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className={cn(
      "group bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col",
      status === "cancelled" && "opacity-60"
    )}>
      <div className="p-4 flex-1 flex flex-col">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PetIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight truncate">{sub.pet?.name ?? "—"}</h4>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <CalendarDays className="w-3 h-3 shrink-0" />
                {startDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {status !== "cancelled" && (
              <Link
                href={`/subscriptions/${sub.id}/edit`}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
            )}
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
              style.badge
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
              {t(`status_${status}` as `status_${SubStatus}`)}
            </span>
          </div>
        </div>

        {/* ── Stat strip ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("duration_days")}</span>
            <span className="font-medium text-xs truncate block">{sub.duration_days}d</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("total_cycles_label")}</span>
            <span className="font-medium text-xs truncate block">{sub.total_cycles ?? "—"}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("estimated_price")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">
              R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {progress && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2.5">
            <Layers className="w-3 h-3 shrink-0" />
            {progress}
          </p>
        )}

        <div className="mt-2.5">
          <RotationChips recipes={sub.recipes} t={t} />
        </div>

        {/* ── Actions ────────────────────────────────────────── */}
        {status !== "cancelled" && (
          <div className="flex items-center gap-2 pt-2.5 mt-auto border-t border-border/50">
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
    </div>
  );
}

/**
 * Compact list row for a single subscription in list view mode.
 * Shows pet, weekly recipes, duration, total cost, week progress and action icons.
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
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors",
      status === "cancelled" && "opacity-60"
    )}>
      {/* Pet avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <PetIcon className="w-4 h-4" />
      </div>

      {/* Pet + weekly recipes + meta */}
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
          <RotationChips recipes={sub.recipes} t={t} />
          <span className="flex items-center gap-1 shrink-0 text-amber-600 dark:text-amber-400 font-semibold">
            R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {sub.duration_days}d · {sub.total_cycles ?? "—"} {t("weeks_count_plural")}
          </span>
          {progress && (
            <span className="flex items-center gap-1 shrink-0">
              <Layers className="w-3 h-3" />{progress}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {status !== "cancelled" && (
          <Link
            href={`/subscriptions/${sub.id}/edit`}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
        )}
        {status !== "cancelled" && (
          isUpdating ? (
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
          )
        )}
      </div>
    </div>
  );
}
