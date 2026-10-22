"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order, Invoice } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JourneyEmptyState } from "@/features/onboarding/components/JourneyEmptyState";
import { Link } from "@/i18n/navigation";
import { ShoppingBag, Plus, Loader2, Package, Calendar, UtensilsCrossed, MapPin, Search, FilterX, ChevronRight, ChevronDown, ChevronUp, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_PIPELINE, getOrderProgressStep, getOrderStatusStyle, type OrderStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { OrderRecipeBlock } from "@/features/orders/components/OrderRecipeBlock";
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

/** Card for an order: status, progress, recipes and invoice. */
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
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-40">
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
          <OrderStatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} />
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

/* ─────────────────────────── Order list ─────────────────────────── */

/**
 * Renders one recency-sorted section (in-progress or history) of the order
 * list in the given view mode.
 */
function OrderSection({
  orders, label, pulse, viewMode, tOrders,
}: {
  orders: Order[];
  label: string;
  pulse?: boolean;
  viewMode: ViewMode;
  tOrders: ReturnType<typeof useTranslations>;
}) {
  if (orders.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        {pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
        <h2 className={cn(
          "text-sm font-semibold text-muted-foreground uppercase tracking-wider",
          !pulse && "border-b pb-2 w-full"
        )}>
          {label} ({orders.length})
        </h2>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => (
            <SingleOrderCard key={order.id} order={order} t={tOrders} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <SingleOrderRow key={order.id} order={order} t={tOrders} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Customer orders page: every order (each one a meal plan for one or more
 * pets), newest first, grouped into in-progress and history sections and
 * searchable by number, recipe or address.
 *
 * @returns The orders page element.
 */
export default function OrdersPage() {
  const tOrders = useTranslations("Orders");
  const tCommon = useTranslations("Common");

  const { orders, isLoading } = useOrders();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");

  const filtered = useMemo<Order[]>(() => {
    const q = search.toLowerCase();

    return (orders ?? [])
      .filter((o) => {
        if (!q) return true;
        return (
          String(o.id).includes(q) ||
          (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false) ||
          (o.recipe?.name?.toLowerCase().includes(q) ?? false) ||
          (o.delivery_address?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search]);

  const activeOrders = filtered.filter((order) => !["delivered", "cancelled"].includes(order.status));
  const historyOrders = filtered.filter((order) => ["delivered", "cancelled"].includes(order.status));

  const hasAnything = !!(orders && orders.length > 0);
  const noResults = hasAnything && filtered.length === 0;
  const isFiltering = search !== "";

  function clearFilters() {
    setSearch("");
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
        <JourneyEmptyState
          icon={<Package className="h-8 w-8" />}
          title={tOrders("no_orders_yet")}
          description={tOrders("no_orders_yet_desc")}
          fallbackAction={{ href: "/orders/new", label: tOrders("create_first_order") }}
        />
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
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? tOrders("results_found_singular") : tOrders("results_found_plural")}
          </p>
          <OrderSection orders={activeOrders} label={tOrders("in_progress")} pulse viewMode={viewMode} tOrders={tOrders} />
          <OrderSection orders={historyOrders} label={tOrders("history")} viewMode={viewMode} tOrders={tOrders} />
        </div>
      )}
    </div>
  );
}
