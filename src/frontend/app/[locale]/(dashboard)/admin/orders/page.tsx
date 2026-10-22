"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { ShoppingBag, CalendarCheck, Loader2, Search, Calendar, UtensilsCrossed, Users, ChevronDown, ChevronUp, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_PIPELINE, ORDER_STATUSES, ORDER_STATUS_STYLE, getOrderProgressStep, getOrderStatusStyle, type OrderStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { OrderRecipeBlock } from "@/features/orders/components/OrderRecipeBlock";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";

/* ─────────────────────────── One-off order pieces ─────────────────────────── */

function AdminOrderCard({
  order, t, onEdit,
}: { order: Order; t: ReturnType<typeof useTranslations>; onEdit: (o: Order) => void }) {
  const style = getOrderStatusStyle(order.status);
  const step = getOrderProgressStep(order.status);
  const isCancelled = order.status === "cancelled";
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

/**
 * Admin orders page — work queue of every customer's orders (each one a meal
 * plan), filterable by status and searchable by number, customer, pet,
 * recipe or address. Status changes happen in a modal.
 *
 * @returns The admin orders management page element.
 */
export default function AdminOrdersPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");

  const { orders, isLoading, updateOrder, isUpdating: isUpdatingOrder } = useOrders();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState("");

  const orderStatusLabel = (s: string) => t(`status_${s}` as `status_${OrderStatus}`);

  function openStatusModal(order: Order) {
    setSelectedOrder(order);
    setNewOrderStatus(order.status);
  }

  async function handleOrderStatusUpdate() {
    if (!selectedOrder || !newOrderStatus) return;
    await updateOrder({ id: selectedOrder.id, status: newOrderStatus });
    setSelectedOrder(null);
  }

  const filtered = useMemo<Order[]>(() => {
    const q = search.toLowerCase();

    return (orders ?? [])
      .filter((o) => {
        const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
        const matchSearch =
          !q ||
          String(o.id).includes(q) ||
          (o.user?.name?.toLowerCase().includes(q) ?? false) ||
          (o.user?.email?.toLowerCase().includes(q) ?? false) ||
          (o.pet?.name?.toLowerCase().includes(q) ?? false) ||
          (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q) || i.pet?.name?.toLowerCase().includes(q)) ?? false) ||
          (o.delivery_address?.toLowerCase().includes(q) ?? false);
        return matchStatus && matchSearch;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, orderStatusFilter]);

  const isFiltering = search !== "" || orderStatusFilter !== "all";
  const viewToggleLabels = { grid: tCommon("grid"), list: tCommon("list") };

  function clearFilters() {
    setSearch("");
    setOrderStatusFilter("all");
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
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            aria-label={t("all_statuses")}
            className="h-10 flex-1 sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("all_statuses")}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel(s)}</option>
            ))}
          </select>

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

      ) : filtered.length === 0 ? (
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
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? t("results_found_singular") : t("results_found_plural")}
          </p>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((order) => (
                <AdminOrderCard key={order.id} order={order} t={t} onEdit={openStatusModal} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((order) => (
                <AdminOrderRow key={order.id} order={order} t={t} onEdit={openStatusModal} />
              ))}
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
              {ORDER_STATUSES.map((s) => (
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
