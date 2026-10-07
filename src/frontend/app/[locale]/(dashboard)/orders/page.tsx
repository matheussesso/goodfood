"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order, Invoice } from "@/hooks/useOrders";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import { ShoppingBag, Plus, Loader2, Package, Calendar, CalendarDays, Dog, Cat, UtensilsCrossed, MapPin, Layers, Search, FilterX, ChevronRight, ChevronDown, ChevronUp, Receipt, AlertCircle, CheckCircle2, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_PIPELINE, getOrderProgressStep, getOrderStatusStyle, getSubscriptionStatusStyle, type OrderStatus, type SubscriptionStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { OrderRecipeBlock } from "@/features/orders/components/OrderRecipeBlock";
import { sortRecipesByWeek, weekProgressLabel } from "@/features/subscriptions/utils";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";

/* ─────────────────────────── One-off order pieces ─────────────────────────── */

const INVOICE_STYLE: Record<Invoice["status"], { cls: string; icon: typeof Receipt }> = {
  pending:   { cls: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800", icon: AlertCircle },
  paid:      { cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", icon: CheckCircle2 },
  failed:    { cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800", icon: AlertCircle },
  cancelled: { cls: "bg-muted text-muted-foreground border-border", icon: Receipt },
};

function InvoiceBadge({ invoice, t }: { invoice: Invoice; t: ReturnType<typeof useTranslations> }) {
  const style = INVOICE_STYLE[invoice.status] ?? INVOICE_STYLE.pending;
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", style.cls)}>
      <Icon className="w-2.5 h-2.5" />
      {t("invoice_label")}: {t(`invoice_status_${invoice.status}` as `invoice_status_pending`)}
    </span>
  );
}

/** Card for a one-off order, tagged with the "Avulso" type badge. */
function SingleOrderCard({ order, t }: { order: Order; t: ReturnType<typeof useTranslations> }) {
  const style = getOrderStatusStyle(order.status);
  const step = getOrderProgressStep(order.status);
  const isCancelled = order.status === "cancelled";
  const isPendingPayment = order.status === "pending_payment";
  const items = order.items ?? [];
  const hasItems = items.length > 0;
  const itemCount = hasItems ? items.length : order.recipe ? 1 : 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-tight truncate">{t("order_number")}{order.id}</h4>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {t("order_badge_single")}
            </span>
            <OrderStatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} />
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("total")}</span>
            <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 truncate block">
              R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("items_count")}</span>
            <span className="font-medium text-xs truncate block">{itemCount}</span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("invoice_label")}</span>
            <span className="font-medium text-xs truncate block">
              {order.invoice ? t(`invoice_status_${order.invoice.status}` as `invoice_status_pending`) : "—"}
            </span>
          </div>
          <div className="px-1.5 py-2 text-center min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("delivery_label")}</span>
            <span className="font-medium text-xs truncate block">
              {isPendingPayment && order.invoice?.due_date
                ? new Date(order.invoice.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                : "—"}
            </span>
          </div>
        </div>

        {isPendingPayment && (
          <div className="flex items-center gap-1.5 mt-2.5 px-2 py-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-[11px] text-orange-700 dark:text-orange-400 line-clamp-1">{t("await_payment_hint")}</span>
          </div>
        )}

        {!isCancelled && (
          <div className="flex items-center gap-1 mt-2.5">
            {ORDER_PIPELINE.map((s, idx) => (
              <div key={s} className={cn("flex-1 h-1 rounded-full transition-colors", idx <= step ? style.bar : "bg-border")} />
            ))}
          </div>
        )}

        <div className="mt-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            <span>{t("order_items_label")} ({itemCount})</span>
            {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {hasItems ? (
                items.map((item) => <OrderRecipeBlock key={item.id} item={item} />)
              ) : order.recipe ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                  {order.recipe.name}
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground italic">—</span>
              )}
            </div>
          )}
        </div>

        {order.delivery_address && (
          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 mt-2.5 line-clamp-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
            {order.delivery_address}
          </p>
        )}

        <Link
          href={`/orders/${order.id}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
        >
          {t("view_detail")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Compact list row for a one-off order. */
function SingleOrderRow({ order, t }: { order: Order; t: ReturnType<typeof useTranslations> }) {
  const items = order.items ?? [];
  const hasItems = items.length > 0;
  const itemCount = hasItems ? items.length : order.recipe ? 1 : 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border rounded-xl hover:border-primary/30 transition-colors overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{t("order_number")}{order.id}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {t("order_badge_single")}
            </span>
            <OrderStatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} />
            {order.invoice && <InvoiceBadge invoice={order.invoice} t={t} />}
          </div>
          {order.delivery_address && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {order.delivery_address}
            </p>
          )}
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
          <p className="text-lg font-bold text-primary">R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <Link href={`/orders/${order.id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2.5">
                {t("view_detail")} <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t"
      >
        <span className="uppercase tracking-wider">{t("order_items_label")} ({itemCount})</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="border-t bg-muted/10 px-4 py-3 divide-y divide-border/50">
          {hasItems ? (
            items.map((item) => <OrderRecipeBlock key={item.id} item={item} />)
          ) : order.recipe ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
              {order.recipe.name}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic py-1.5 block">—</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Subscription pieces ─────────────────────────── */

/** Collapsed-by-default accordion listing a plan's weekly recipes, ordered by week. */
function SubscriptionRecipesAccordion({ recipes, t }: { recipes: Subscription["recipes"]; t: ReturnType<typeof useTranslations> }) {
  const [expanded, setExpanded] = useState(false);
  const ordered = sortRecipesByWeek(recipes);

  if (ordered.length === 0) {
    return <span className="text-xs text-muted-foreground italic">—</span>;
  }

  return (
    <div className="mt-2.5 pt-2 border-t border-border/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <span>{t("select_recipes")} ({ordered.length})</span>
        {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
          {ordered.map((recipe, index) => (
            <li key={`${recipe.id}-${index}`} className="flex items-center justify-between text-[11px] gap-2">
              <span className="text-muted-foreground shrink-0">{t("rotation_order", { n: String(index + 1) })}</span>
              <span className="text-foreground truncate flex-1 text-right">{recipe.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SubscriptionCardProps {
  sub: Subscription;
  t: ReturnType<typeof useTranslations>;
  isUpdating: boolean;
  onStatusChange: (sub: Subscription, status: SubscriptionStatus) => void;
}

/** Card for a recurring subscription plan, tagged with the "Assinatura" type badge. */
function SubscriptionSummaryCard({ sub, t, isUpdating, onStatusChange }: SubscriptionCardProps) {
  const tOrders = useTranslations("Orders");
  const status = sub.status as SubscriptionStatus;
  const style = getSubscriptionStatusStyle(status);
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
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {tOrders("subscription_badge")}
            </span>
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border", style.badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
              {t(`status_${status}` as `status_${SubscriptionStatus}`)}
            </span>
          </div>
        </div>

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

        <SubscriptionRecipesAccordion recipes={sub.recipes} t={t} />

        {status !== "cancelled" && (
          <div className="flex items-center gap-2 mt-2.5">
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

        <Link
          href={`/orders/subscriptions/${sub.id}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
        >
          {t("view_detail")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Compact list row for a recurring subscription plan. */
function SubscriptionSummaryRow({ sub, t, isUpdating, onStatusChange }: SubscriptionCardProps) {
  const tOrders = useTranslations("Orders");
  const status = sub.status as SubscriptionStatus;
  const style = getSubscriptionStatusStyle(status);
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);
  const orderedRecipes = sortRecipesByWeek(sub.recipes);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(status === "cancelled" && "opacity-60")}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <PetIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground line-clamp-1">{sub.pet?.name ?? "—"}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {tOrders("subscription_badge")}
            </span>
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", style.badge)}>
              <span className={cn("w-1 h-1 rounded-full", style.dot)} />
              {t(`status_${status}` as `status_${SubscriptionStatus}`)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
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
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/orders/subscriptions/${sub.id}`}
            title={t("view_detail")}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
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

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border/50"
      >
        <span className="uppercase tracking-wider">{t("select_recipes")} ({orderedRecipes.length})</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50 bg-muted/10 px-4 py-3">
          {orderedRecipes.length > 0 ? (
            <ul className="space-y-1.5">
              {orderedRecipes.map((recipe, index) => (
                <li key={`${recipe.id}-${index}`} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-muted-foreground shrink-0">{t("rotation_order", { n: String(index + 1) })}</span>
                  <span className="text-foreground truncate flex-1 text-right font-medium">{recipe.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">—</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Unified list ─────────────────────────── */

type UnifiedItem =
  | { kind: "single"; sortDate: string; data: Order }
  | { kind: "subscription"; sortDate: string; data: Subscription };

type TypeFilter = "all" | "single" | "subscription";

/**
 * Renders one recency-sorted section (in-progress or history) of the
 * unified list in the given view mode.
 */
function UnifiedSection({
  items, label, pulse, viewMode, tOrders, tSub, isUpdatingSub, onSubStatusChange,
}: {
  items: UnifiedItem[];
  label: string;
  pulse?: boolean;
  viewMode: ViewMode;
  tOrders: ReturnType<typeof useTranslations>;
  tSub: ReturnType<typeof useTranslations>;
  isUpdatingSub: boolean;
  onSubStatusChange: (sub: Subscription, status: SubscriptionStatus) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        {pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        <h2 className={cn(
          "text-sm font-semibold text-muted-foreground uppercase tracking-wider",
          !pulse && "border-b pb-2 w-full"
        )}>
          {label} ({items.length})
        </h2>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) =>
            item.kind === "single" ? (
              <SingleOrderCard key={`order-${item.data.id}`} order={item.data} t={tOrders} />
            ) : (
              <SubscriptionSummaryCard
                key={`sub-${item.data.id}`}
                sub={item.data}
                t={tSub}
                isUpdating={isUpdatingSub}
                onStatusChange={onSubStatusChange}
              />
            )
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) =>
            item.kind === "single" ? (
              <SingleOrderRow key={`order-${item.data.id}`} order={item.data} t={tOrders} />
            ) : (
              <SubscriptionSummaryRow
                key={`sub-${item.data.id}`}
                sub={item.data}
                t={tSub}
                isUpdating={isUpdatingSub}
                onStatusChange={onSubStatusChange}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Customer orders page — unified view of one-off orders and recurring
 * subscriptions. Both are created from the same "Novo Pedido" entry point
 * (which branches by type) and listed together here, grouped into
 * in-progress/history sections and filterable by type.
 *
 * @returns The unified orders page element.
 */
export default function OrdersPage() {
  const tOrders = useTranslations("Orders");
  const tSub = useTranslations("Subscriptions");
  const tCommon = useTranslations("Common");

  const { orders, isLoading: isLoadingOrders } = useOrders();
  const { subscriptions, isLoading: isLoadingSubs, updateSubscription, isUpdating: isUpdatingSub } = useSubscriptions();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isLoading = isLoadingOrders || isLoadingSubs;

  async function handleSubStatusChange(sub: Subscription, status: SubscriptionStatus) {
    if (status === "cancelled" && !confirm(tSub("cancel_confirm"))) return;
    try {
      await updateSubscription({ id: sub.id, status });
      setFeedback({ type: "success", message: tSub("status_updated") });
    } catch {
      setFeedback({ type: "error", message: tSub("error_update") });
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  const unified = useMemo<UnifiedItem[]>(() => {
    const q = search.toLowerCase();

    const singleItems: UnifiedItem[] = (typeFilter === "subscription" ? [] : orders ?? [])
      .filter((o) => {
        if (!q) return true;
        return (
          String(o.id).includes(q) ||
          (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false) ||
          (o.recipe?.name?.toLowerCase().includes(q) ?? false) ||
          (o.delivery_address?.toLowerCase().includes(q) ?? false)
        );
      })
      .map((o) => ({ kind: "single" as const, sortDate: o.created_at, data: o }));

    const subscriptionItems: UnifiedItem[] = (typeFilter === "single" ? [] : subscriptions ?? [])
      .filter((s) => {
        if (!q) return true;
        return (
          (s.pet?.name?.toLowerCase().includes(q) ?? false) ||
          (s.recipes?.some((r) => r.name?.toLowerCase().includes(q)) ?? false)
        );
      })
      .map((s) => ({ kind: "subscription" as const, sortDate: s.created_at, data: s }));

    return [...singleItems, ...subscriptionItems].sort(
      (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    );
  }, [orders, subscriptions, search, typeFilter]);

  const activeItems = unified.filter((item) =>
    item.kind === "single"
      ? !["delivered", "cancelled"].includes(item.data.status)
      : item.data.status !== "cancelled"
  );
  const historyItems = unified.filter((item) =>
    item.kind === "single"
      ? ["delivered", "cancelled"].includes(item.data.status)
      : item.data.status === "cancelled"
  );

  const hasAnything = !!((orders && orders.length > 0) || (subscriptions && subscriptions.length > 0));
  const noResults = hasAnything && unified.length === 0;
  const isFiltering = search !== "" || typeFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
  }

  const viewToggleLabels = { grid: tCommon("grid"), list: tCommon("list") };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-primary mb-1" />
            {tOrders("my_orders")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{tOrders("my_orders_desc")}</p>
        </div>
        <Link href="/orders/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> {tOrders("new_order")}
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

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      {hasAnything && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tOrders("customer_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="h-10 flex-1 sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">{tOrders("type_filter_all")}</option>
                <option value="single">{tOrders("type_filter_single")}</option>
                <option value="subscription">{tOrders("type_filter_subscription")}</option>
              </select>
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} />
            </div>
          </div>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} mobile />
        </>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">{tOrders("loading")}</span>
        </div>

      ) : !hasAnything ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-7 h-7 text-primary/60" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{tOrders("no_orders_yet")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{tOrders("no_orders_yet_desc")}</p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-2"><Plus className="w-4 h-4" /> {tOrders("create_first_order")}</Button>
          </Link>
        </div>

      ) : noResults ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-4 text-muted-foreground text-center">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
            <FilterX className="w-7 h-7 opacity-40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{tCommon("no_results")}</p>
            <p className="text-sm mt-1">{tCommon("adjust_filters")}</p>
          </div>
          {isFiltering && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {tCommon("clear_filters")}
            </Button>
          )}
        </div>

      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground px-1">
            <span className="font-semibold text-foreground">{unified.length}</span>{" "}
            {unified.length === 1 ? tOrders("results_found_singular") : tOrders("results_found_plural")}
          </p>
          <UnifiedSection
            items={activeItems}
            label={tOrders("in_progress")}
            pulse
            viewMode={viewMode}
            tOrders={tOrders}
            tSub={tSub}
            isUpdatingSub={isUpdatingSub}
            onSubStatusChange={handleSubStatusChange}
          />
          <UnifiedSection
            items={historyItems}
            label={tOrders("history")}
            viewMode={viewMode}
            tOrders={tOrders}
            tSub={tSub}
            isUpdatingSub={isUpdatingSub}
            onSubStatusChange={handleSubStatusChange}
          />
        </div>
      )}
    </div>
  );
}
