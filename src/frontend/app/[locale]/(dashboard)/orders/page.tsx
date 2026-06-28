"use client";

import { useTranslations } from "next-intl";
import { useOrders, Order, OrderItem } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  ShoppingBag,
  Plus,
  Loader2,
  Package,
  Calendar,
  Dog,
  Cat,
  UtensilsCrossed,
  MapPin,
  Clock,
  Layers,
} from "lucide-react";

/** Status pipeline ordered by progression. */
const STATUS_PIPELINE = [
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

type OrderStatus = (typeof STATUS_PIPELINE)[number] | "cancelled";

/** Tailwind colour classes per status. */
const STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string; progress: string }> = {
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",      dot: "bg-amber-400",    progress: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",             dot: "bg-blue-400",     progress: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800", dot: "bg-violet-400",   progress: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                  dot: "bg-sky-400",      progress: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", progress: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                  dot: "bg-red-400",      progress: "bg-red-400" },
};

/** Progress step index (0–4) for the 5-step pipeline. -1 = cancelled. */
function progressStep(status: string): number {
  const idx = STATUS_PIPELINE.indexOf(status as (typeof STATUS_PIPELINE)[number]);
  return idx;
}

/**
 * Renders a status badge pill.
 *
 * @param status - Order status value.
 * @param label - Translated label string.
 */
function StatusBadge({ status, label }: { status: string; label: string }) {
  const style = STATUS_STYLE[status as OrderStatus] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

/**
 * Renders a single recipe item row inside an order card.
 *
 * @param item - The order item data.
 * @param tPer - Translation function for "per_pet".
 */
function RecipeRow({ item, tPer }: { item: OrderItem; tPer: (key: string, values?: Record<string, string>) => string }) {
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <UtensilsCrossed className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          {item.recipe?.name ?? `Receita #${item.recipe_id}`}
        </p>
        {item.pet && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <PetIcon className="w-3 h-3" />
            {tPer("per_pet", { pet: item.pet.name })}
          </p>
        )}
        {item.recipe?.duration_days && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.recipe.duration_days}d
            {item.recipe?.ingredients && item.recipe.ingredients.length > 0 && (
              <> · <Layers className="w-3 h-3" /> {item.recipe.ingredients.length} ingred.</>
            )}
          </p>
        )}
      </div>
      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">
        R$ {Number(item.unit_price).toFixed(2)}
      </span>
    </div>
  );
}

/**
 * Renders a full order card with status progress, recipe details, and address.
 *
 * @param order - The order to display.
 * @param t - The Orders translation function.
 */
function OrderCard({ order, t }: { order: Order; t: ReturnType<typeof useTranslations> }) {
  const status = order.status as OrderStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const step = progressStep(order.status);
  const isCancelled = order.status === "cancelled";

  const hasItems = order.items && order.items.length > 0;

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
      {/* ── Card header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-foreground">{t("order_number")}{order.id}</span>
              <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {t("order_date")} {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold text-primary shrink-0 sm:text-right">
          R$ {Number(order.total_price).toFixed(2)}
        </p>
      </div>

      {/* ── Progress bar (active orders only) ───────────────────────── */}
      {!isCancelled && (
        <div className="px-5 py-3 border-b bg-muted/20">
          <div className="flex items-center gap-1">
            {STATUS_PIPELINE.map((s, idx) => {
              const active = idx <= step;
              return (
                <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${active ? style.progress : "bg-border"}`} />
                  {idx === STATUS_PIPELINE.length - 1 && null}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide font-medium">
            {t(`status_${order.status}` as any)}
          </p>
        </div>
      )}

      {/* ── Recipe items ─────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        {hasItems ? (
          <div className="divide-y divide-border/50">
            {order.items!.map((item) => (
              <RecipeRow
                key={item.id}
                item={item}
                tPer={(key, values) => t(key as any, values)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4" />
            {order.recipe?.name ?? "—"}
          </p>
        )}
      </div>

      {/* ── Footer: address ──────────────────────────────────────────── */}
      {order.delivery_address && (
        <div className="px-5 py-3 border-t bg-muted/10">
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
            <span>
              <span className="font-medium text-foreground">{t("delivery_address_detail")}: </span>
              {order.delivery_address}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Customer orders page — lists active orders with progress and order history.
 *
 * @returns The orders list page element.
 */
export default function OrdersPage() {
  const t = useTranslations("Orders");
  const { orders, isLoading } = useOrders();

  const activeOrders = orders?.filter((o) => !["delivered", "cancelled"].includes(o.status)) ?? [];
  const pastOrders   = orders?.filter((o) => ["delivered", "cancelled"].includes(o.status)) ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-primary" />
            {t("my_orders")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("my_orders_desc")}</p>
        </div>
        <Link href="/orders/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> {t("new_order")}
          </Button>
        </Link>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("no_orders_yet")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{t("no_orders_yet_desc")}</p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> {t("create_first_order")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeOrders.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("in_progress")} ({activeOrders.length})
                </h2>
              </div>
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} t={t} />
              ))}
            </section>
          )}

          {pastOrders.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                {t("history")} ({pastOrders.length})
              </h2>
              {pastOrders.map((order) => (
                <OrderCard key={order.id} order={order} t={t} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
