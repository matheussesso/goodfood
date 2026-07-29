"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order, OrderItem } from "@/hooks/useOrders";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import {
  ShoppingBag,
  CalendarCheck,
  Loader2,
  Search,
  Calendar,
  CalendarDays,
  Dog,
  Cat,
  UtensilsCrossed,
  Users,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  ExternalLink,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";

/* ─────────────────────────── One-off order pieces ─────────────────────────── */

const ORDER_STATUS_VALUES = [
  "pending_payment",
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];
const ORDER_STATUS_PIPELINE = ORDER_STATUS_VALUES.slice(0, 6) as readonly string[];

const ORDER_STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string; bar: string }> = {
  pending_payment:  { badge: "text-orange-700 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",       dot: "bg-orange-400",  bar: "bg-orange-400" },
  pending:          { badge: "text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",            dot: "bg-amber-400",   bar: "bg-amber-400" },
  in_production:    { badge: "text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",                  dot: "bg-blue-400",    bar: "bg-blue-400" },
  ready:            { badge: "text-violet-700 bg-violet-100 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",      dot: "bg-violet-400",  bar: "bg-violet-400" },
  out_for_delivery: { badge: "text-sky-700 bg-sky-100 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                       dot: "bg-sky-400",     bar: "bg-sky-400" },
  delivered:        { badge: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  cancelled:        { badge: "text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400",     bar: "bg-red-400" },
};

function orderProgressStep(status: string): number {
  return ORDER_STATUS_PIPELINE.indexOf(status);
}

function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  const s = ORDER_STATUS_STYLE[status as OrderStatus] ?? ORDER_STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function OrderRecipeBlock({ item }: { item: OrderItem }) {
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
  return (
    <div className="flex items-start gap-2 py-1.5 first:pt-0">
      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <UtensilsCrossed className="w-3 h-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/recipes/${item.recipe_id}`}
          className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 flex items-center gap-1 group"
        >
          {item.recipe?.name ?? `#${item.recipe_id}`}
          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 shrink-0" />
        </Link>
        {item.pet && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <PetIcon className="w-3 h-3" /> {item.pet.name}
          </p>
        )}
      </div>
      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
        R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

function AdminOrderCard({
  order, t, onEdit,
}: { order: Order; t: ReturnType<typeof useTranslations>; onEdit: (o: Order) => void }) {
  const status = order.status as OrderStatus;
  const style = ORDER_STATUS_STYLE[status] ?? ORDER_STATUS_STYLE.pending;
  const step = orderProgressStep(order.status);
  const isCancelled = order.status === "cancelled";
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

        {order.user && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-2.5 min-w-0">
            <Users className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="font-medium text-foreground truncate">{order.user.name}</span>
            <span className="text-muted-foreground/60 truncate">· {order.user.email}</span>
          </p>
        )}

        <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 rounded-lg">
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
        </div>

        {!isCancelled && (
          <div className="flex items-center gap-1 mt-2.5">
            {ORDER_STATUS_PIPELINE.map((s, idx) => (
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

        <div className="flex gap-2 pt-2.5 mt-auto border-t border-border/50">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => onEdit(order)}>
            {t("update_status")} <ChevronDown className="w-3 h-3" />
          </Button>
          <Link href={`/admin/orders/${order.id}`}>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-9 px-2.5">
              {t("view_detail")} <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminOrderRow({
  order, t, onEdit,
}: { order: Order; t: ReturnType<typeof useTranslations>; onEdit: (o: Order) => void }) {
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
          </div>
          {order.user && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3 shrink-0" />
              {order.user.name}
              {order.user.email && <span className="text-muted-foreground/60">· {order.user.email}</span>}
            </p>
          )}
          {order.delivery_address && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {order.delivery_address}
            </p>
          )}
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <p className="text-lg font-bold text-primary">R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5" onClick={() => onEdit(order)}>
              {t("update_status")} <ChevronDown className="w-3 h-3" />
            </Button>
            <Link href={`/admin/orders/${order.id}`}>
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

const SUB_STATUS_VALUES = ["active", "paused", "cancelled"] as const;
type SubStatus = (typeof SUB_STATUS_VALUES)[number];

const SUB_STATUS_STYLE: Record<SubStatus, { badge: string; dot: string }> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",           dot: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400" },
};

function weekProgressLabel(sub: Subscription, t: ReturnType<typeof useTranslations>): string | null {
  if (sub.current_cycle_index === null || sub.current_cycle_index === undefined) return null;
  if (!sub.total_cycles) return null;
  return t("current_week_progress", { current: String(sub.current_cycle_index + 1), total: String(sub.total_cycles) });
}

interface AdminSubProps {
  sub: Subscription;
  t: ReturnType<typeof useTranslations>;
  tOrders: ReturnType<typeof useTranslations>;
  isUpdating: boolean;
  onStatusChange: (sub: Subscription, status: SubStatus) => void;
}

function AdminSubscriptionCard({ sub, t, tOrders, isUpdating, onStatusChange }: AdminSubProps) {
  const status = sub.status as SubStatus;
  const style = SUB_STATUS_STYLE[status] ?? SUB_STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);
  const [expanded, setExpanded] = useState(false);
  const orderedRecipes = [...(sub.recipes ?? [])].sort((a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0));

  const startDate = sub.start_date
    ? new Date(sub.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className={cn(
      "bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/30 transition-colors flex flex-col",
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
              {t(`status_${status}` as `status_${SubStatus}`)}
            </span>
          </div>
        </div>

        {sub.user && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-2.5 min-w-0">
            <Users className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="font-medium text-foreground truncate">{sub.user.name}</span>
            <span className="text-muted-foreground/60 truncate">· {sub.user.email}</span>
          </p>
        )}

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

        <div className="mt-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            <span>{t("select_recipes")} ({orderedRecipes.length})</span>
            {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
              {orderedRecipes.map((recipe, index) => (
                <li key={`${recipe.id}-${index}`} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="text-muted-foreground shrink-0">{t("rotation_order", { n: String(index + 1) })}</span>
                  <span className="text-foreground truncate flex-1 text-right">{recipe.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status !== "cancelled" && (
          <div className="flex items-center gap-1 mt-2.5 pt-1">
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

function AdminSubscriptionRow({ sub, t, tOrders, isUpdating, onStatusChange }: AdminSubProps) {
  const status = sub.status as SubStatus;
  const style = SUB_STATUS_STYLE[status] ?? SUB_STATUS_STYLE.active;
  const PetIcon = sub.pet?.type === "cat" ? Cat : Dog;
  const estimatedPrice = sub.estimated_price ?? 0;
  const progress = weekProgressLabel(sub, t);

  return (
    <div className={cn(
      "bg-card border rounded-xl hover:border-primary/30 transition-colors overflow-hidden",
      status === "cancelled" && "opacity-60"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <PetIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{sub.pet?.name ?? "—"}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {tOrders("subscription_badge")}
            </span>
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", style.badge)}>
              <span className={cn("w-1 h-1 rounded-full", style.dot)} />
              {t(`status_${status}` as `status_${SubStatus}`)}
            </span>
          </div>
          {sub.user && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3 shrink-0" />
              {sub.user.name}
              {sub.user.email && <span className="text-muted-foreground/60">· {sub.user.email}</span>}
            </p>
          )}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              R$ {estimatedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span>{sub.duration_days}d · {sub.total_cycles ?? "—"} {t("weeks_count_plural")}</span>
            {progress && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{progress}</span>}
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Link href={`/orders/subscriptions/${sub.id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2.5">
                {t("view_detail")} <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
            {status !== "cancelled" && (
              isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {status === "active" ? (
                    <button type="button" title={t("pause_subscription")} onClick={() => onStatusChange(sub, "paused")} className="p-1.5 rounded text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" title={t("resume_subscription")} onClick={() => onStatusChange(sub, "active")} className="p-1.5 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors">
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" title={t("cancel_subscription")} onClick={() => onStatusChange(sub, "cancelled")} className="p-1.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Unified list ─────────────────────────── */

type UnifiedItem =
  | { kind: "single"; sortDate: string; data: Order }
  | { kind: "subscription"; sortDate: string; data: Subscription };

type TypeFilter = "all" | "single" | "subscription";

/**
 * Admin orders page — unified work queue of one-off orders and recurring
 * subscriptions from every customer. Filterable by type and (when a single
 * type is selected) by that type's own status vocabulary.
 *
 * @returns The admin orders management page element.
 */
export default function AdminOrdersPage() {
  const t = useTranslations("Orders");
  const tSub = useTranslations("Subscriptions");
  const tCommon = useTranslations("Common");

  const { orders, isLoading: isLoadingOrders, updateOrder, isUpdating: isUpdatingOrder } = useOrders();
  const { subscriptions, isLoading: isLoadingSubs, updateSubscription, isUpdating: isUpdatingSub } = useSubscriptions();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isLoading = isLoadingOrders || isLoadingSubs;
  const orderStatusLabel = (s: string) => t(`status_${s}` as `status_${OrderStatus}`);

  function handleTypeFilterChange(next: TypeFilter) {
    setTypeFilter(next);
    setOrderStatusFilter("all");
    setSubStatusFilter("all");
  }

  function openStatusModal(order: Order) {
    setSelectedOrder(order);
    setNewOrderStatus(order.status);
  }

  async function handleOrderStatusUpdate() {
    if (!selectedOrder || !newOrderStatus) return;
    await updateOrder({ id: selectedOrder.id, status: newOrderStatus });
    setSelectedOrder(null);
  }

  async function handleSubStatusChange(sub: Subscription, status: SubStatus) {
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
        const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
        const matchSearch =
          !q ||
          String(o.id).includes(q) ||
          (o.user?.name?.toLowerCase().includes(q) ?? false) ||
          (o.user?.email?.toLowerCase().includes(q) ?? false) ||
          (o.pet?.name?.toLowerCase().includes(q) ?? false) ||
          (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false) ||
          (o.delivery_address?.toLowerCase().includes(q) ?? false);
        return matchStatus && matchSearch;
      })
      .map((o) => ({ kind: "single" as const, sortDate: o.created_at, data: o }));

    const subscriptionItems: UnifiedItem[] = (typeFilter === "single" ? [] : subscriptions ?? [])
      .filter((s) => {
        const matchStatus = subStatusFilter === "all" || s.status === subStatusFilter;
        const matchSearch =
          !q ||
          (s.pet?.name?.toLowerCase().includes(q) ?? false) ||
          (s.recipes?.some((r) => r.name?.toLowerCase().includes(q)) ?? false) ||
          (s.user?.name?.toLowerCase().includes(q) ?? false);
        return matchStatus && matchSearch;
      })
      .map((s) => ({ kind: "subscription" as const, sortDate: s.created_at, data: s }));

    return [...singleItems, ...subscriptionItems].sort(
      (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    );
  }, [orders, subscriptions, search, typeFilter, orderStatusFilter, subStatusFilter]);

  const isFiltering = search !== "" || typeFilter !== "all" || orderStatusFilter !== "all" || subStatusFilter !== "all";
  const viewToggleLabels = { grid: tCommon("grid"), list: tCommon("list") };

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setOrderStatusFilter("all");
    setSubStatusFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-primary mb-1" />
          {t("management_title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("management_desc")}</p>
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
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value as TypeFilter)}
            className="h-10 flex-1 sm:w-44 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("type_filter_all")}</option>
            <option value="single">{t("type_filter_single")}</option>
            <option value="subscription">{t("type_filter_subscription")}</option>
          </select>

          {typeFilter === "single" && (
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="h-10 flex-1 sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("all_statuses")}</option>
              {ORDER_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>{orderStatusLabel(s)}</option>
              ))}
            </select>
          )}

          {typeFilter === "subscription" && (
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              className="h-10 flex-1 sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("all_statuses")}</option>
              {SUB_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>{tSub(`status_${s}` as `status_${SubStatus}`)}</option>
              ))}
            </select>
          )}

          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} />
        </div>
      </div>
      <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} labels={viewToggleLabels} mobile />

      {/* ── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">{t("loading")}</span>
        </div>

      ) : unified.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-4 text-muted-foreground text-center">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
            <CalendarCheck className="w-7 h-7 opacity-40" />
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
        <>
          <p className="text-sm text-muted-foreground px-1">
            <span className="font-semibold text-foreground">{unified.length}</span>{" "}
            {unified.length === 1 ? t("results_found_singular") : t("results_found_plural")}
          </p>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {unified.map((item) =>
                item.kind === "single" ? (
                  <AdminOrderCard key={`order-${item.data.id}`} order={item.data} t={t} onEdit={openStatusModal} />
                ) : (
                  <AdminSubscriptionCard
                    key={`sub-${item.data.id}`}
                    sub={item.data}
                    t={tSub}
                    tOrders={t}
                    isUpdating={isUpdatingSub}
                    onStatusChange={handleSubStatusChange}
                  />
                )
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {unified.map((item) =>
                item.kind === "single" ? (
                  <AdminOrderRow key={`order-${item.data.id}`} order={item.data} t={t} onEdit={openStatusModal} />
                ) : (
                  <AdminSubscriptionRow
                    key={`sub-${item.data.id}`}
                    sub={item.data}
                    t={tSub}
                    tOrders={t}
                    isUpdating={isUpdatingSub}
                    onStatusChange={handleSubStatusChange}
                  />
                )
              )}
            </div>
          )}
        </>
      )}

      {/* ── Order status update modal ──────────────────────────────── */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={t("update_status_title", { id: String(selectedOrder?.id ?? "") })}
      >
        <div className="space-y-5">
          <div className="bg-muted/30 border rounded-xl p-4 space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">{t("client")}:</span> <span className="font-medium">{selectedOrder?.user?.name ?? "—"}</span></p>
            <p><span className="text-muted-foreground">{t("pet")}:</span> <span className="font-medium">{selectedOrder?.items?.map(i => i.pet?.name).filter(Boolean).join(", ") || selectedOrder?.pet?.name || "—"}</span></p>
            <p><span className="text-muted-foreground">{t("total")}:</span> <span className="font-bold text-primary">R$ {Number(selectedOrder?.total_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("current_status")}:</span>
              {selectedOrder && (
                <OrderStatusBadge status={selectedOrder.status} label={orderStatusLabel(selectedOrder.status)} />
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">{t("new_status")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {ORDER_STATUS_VALUES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewOrderStatus(s)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    newOrderStatus === s
                      ? `${ORDER_STATUS_STYLE[s].badge} border-2`
                      : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", newOrderStatus === s ? ORDER_STATUS_STYLE[s].dot : "bg-muted-foreground/30")} />
                  {orderStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleOrderStatusUpdate}
              disabled={isUpdatingOrder || newOrderStatus === selectedOrder?.status}
              className="gap-2"
            >
              {isUpdatingOrder && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("save_status")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
