"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag,
  Loader2,
  Search,
  Calendar,
  Dog,
  UtensilsCrossed,
  Users,
  ChevronDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Status pipeline ordered by progression. */
const STATUS_VALUES = [
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof STATUS_VALUES)[number];

/** Color classes per status. */
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:          "text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  in_production:    "text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  ready:            "text-violet-700 bg-violet-100 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  out_for_delivery: "text-sky-700 bg-sky-100 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
  delivered:        "text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled:        "text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

/**
 * Admin orders management page.
 * Lists all customer orders with search, status filter, and status update controls.
 *
 * @returns The admin orders management page element.
 */
export default function AdminOrdersPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");

  const { orders, isLoading, updateOrder, isUpdating } = useOrders();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");

  /** Translated label for each status value. */
  const statusLabel = (s: string) => t(`status_${s}` as any);

  const filtered = useMemo<Order[]>(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(o.id).includes(q) ||
        (o.user?.name?.toLowerCase().includes(q) ?? false) ||
        (o.pet?.name?.toLowerCase().includes(q) ?? false) ||
        (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false);
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  /** Count per status for the filter chips. */
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { all: orders?.length ?? 0 };
    orders?.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  function openEditModal(order: Order) {
    setSelectedOrder(order);
    setNewStatus(order.status);
  }

  async function handleStatusUpdate() {
    if (!selectedOrder || !newStatus) return;
    await updateOrder({ id: selectedOrder.id, status: newStatus });
    setSelectedOrder(null);
  }

  const recipeNames = (order: Order) =>
    order.items && order.items.length > 0
      ? order.items.map((i) => i.recipe?.name ?? `${t("recipe")} #${i.recipe_id}`).join(", ")
      : order.recipe?.name ?? "—";

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-primary" />
          {t("management_title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("management_desc")}</p>
      </div>

      {/* ── Stat chips (clickable status filter) ────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_VALUES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={cn(
              "bg-card border rounded-xl p-3 text-center transition-all hover:border-primary/50 hover:shadow-sm",
              filterStatus === s && "border-primary shadow-sm"
            )}
          >
            <span className={`text-lg font-bold block ${STATUS_COLORS[s].split(" ")[0]}`}>
              {countByStatus[s] ?? 0}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight block mt-0.5">
              {statusLabel(s)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t("all_statuses")} ({countByStatus.all})</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)} ({countByStatus[s] ?? 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Orders list ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-3 text-muted-foreground">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm">{t("no_orders")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground px-1">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? t("orders_found_singular") : t("orders_found_plural")}
          </p>

          {filtered.map((order) => {
            const colorClass = STATUS_COLORS[order.status as OrderStatus] ?? "bg-muted text-muted-foreground border-border";
            return (
              <div
                key={order.id}
                className="bg-card border rounded-xl shadow-sm p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: order info */}
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{t("order_number")}{order.id}</span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colorClass}`}>
                          {statusLabel(order.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">{recipeNames(order)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {order.user && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {order.user.name}
                          </span>
                        )}
                        {order.pet && (
                          <span className="flex items-center gap-1">
                            <Dog className="w-3.5 h-3.5" /> {order.pet.name}
                          </span>
                        )}
                        {order.delivery_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {t("delivery_label")}: {new Date(order.delivery_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {order.delivery_address && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          📍 {order.delivery_address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: price + action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                    <p className="text-2xl font-bold text-primary">
                      R$ {Number(order.total_price).toFixed(2)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => openEditModal(order)}
                    >
                      {t("update_status")} <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Items breakdown */}
                {order.items && order.items.length > 1 && (
                  <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span
                        key={item.id}
                        className="text-xs px-2.5 py-1 bg-muted border rounded-full flex items-center gap-1.5"
                      >
                        <UtensilsCrossed className="w-3 h-3 text-muted-foreground" />
                        {item.recipe?.name ?? `${t("recipe")} #${item.recipe_id}`}
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          R$ {Number(item.unit_price).toFixed(2)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Status Update Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={t("update_status_title", { id: String(selectedOrder?.id ?? "") })}
      >
        <div className="space-y-5">
          <div className="bg-muted/30 border rounded-xl p-4 space-y-1.5 text-sm">
            <p><span className="text-muted-foreground">{t("client")}:</span> <span className="font-medium">{selectedOrder?.user?.name ?? "—"}</span></p>
            <p><span className="text-muted-foreground">{t("pet")}:</span> <span className="font-medium">{selectedOrder?.pet?.name ?? "—"}</span></p>
            <p><span className="text-muted-foreground">{t("total")}:</span> <span className="font-bold text-primary">R$ {Number(selectedOrder?.total_price ?? 0).toFixed(2)}</span></p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("current_status")}:</span>
              {selectedOrder && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[selectedOrder.status as OrderStatus] ?? "bg-muted border-border"}`}>
                  {statusLabel(selectedOrder.status)}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">{t("new_status")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_VALUES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewStatus(s)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    newStatus === s
                      ? `${STATUS_COLORS[s]} border-2`
                      : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", newStatus === s ? "bg-current" : "bg-muted-foreground/30")} />
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || newStatus === selectedOrder?.status}
              className="gap-2"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("save_status")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
