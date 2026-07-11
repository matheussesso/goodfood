"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order, OrderItem } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import {
  ShoppingBag,
  Loader2,
  Search,
  Calendar,
  Dog,
  Cat,
  UtensilsCrossed,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  FilterX,
  MapPin,
  Clock,
  Salad,
  Layers,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";

const STATUS_VALUES = [
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof STATUS_VALUES)[number];

const STATUS_PIPELINE = STATUS_VALUES.slice(0, 5) as readonly string[];

const STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string; bar: string }> = {
  pending:          { badge: "text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",            dot: "bg-amber-400",   bar: "bg-amber-400" },
  in_production:    { badge: "text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",                  dot: "bg-blue-400",    bar: "bg-blue-400" },
  ready:            { badge: "text-violet-700 bg-violet-100 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",      dot: "bg-violet-400",  bar: "bg-violet-400" },
  out_for_delivery: { badge: "text-sky-700 bg-sky-100 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                       dot: "bg-sky-400",     bar: "bg-sky-400" },
  delivered:        { badge: "text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  cancelled:        { badge: "text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400",     bar: "bg-red-400" },
};

function progressStep(status: string): number {
  return STATUS_PIPELINE.indexOf(status);
}

/**
 * Status badge pill.
 *
 * @param status - Raw status value.
 * @param label - Translated label.
 */
function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = STATUS_STYLE[status as OrderStatus] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

/**
 * Recipe item block — clickable link with stats.
 * Shared between card and list views via the `compact` prop.
 *
 * @param item - The OrderItem to render.
 * @param compact - Compact single-line variant for list view.
 */
function RecipeBlock({ item, compact = false }: { item: OrderItem; compact?: boolean }) {
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;

  const stats = item.recipe && (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      {item.recipe.duration_days && (
        <span className="flex items-center gap-0.5 shrink-0">
          <Clock className="w-3 h-3" />
          {item.recipe.duration_days}d
        </span>
      )}
      {item.recipe.daily_portions && (
        <span className="flex items-center gap-0.5 shrink-0">
          <Salad className="w-3 h-3" />
          {item.recipe.daily_portions}x/dia
        </span>
      )}
      {item.recipe.ingredients && item.recipe.ingredients.length > 0 && (
        <span className="flex items-center gap-0.5 shrink-0">
          <Layers className="w-3 h-3" />
          {item.recipe.ingredients.length} ing.
        </span>
      )}
    </div>
  );

  if (compact) {
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
          {stats && <div className="mt-0.5">{stats}</div>}
        </div>
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 overflow-hidden">
      <Link
        href={`/recipes/${item.recipe_id}`}
        className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {item.recipe?.name ?? `#${item.recipe_id}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
      <div className="px-3 pb-2.5 space-y-1.5">
        {item.pet && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <PetIcon className="w-3 h-3" /> {item.pet.name}
          </p>
        )}
        {stats}
      </div>
    </div>
  );
}

/**
 * Order card for the 3-column admin grid view.
 *
 * @param order - Order data.
 * @param t - Orders translation function.
 * @param onEdit - Opens the status update modal.
 */
function AdminOrderCard({
  order, t, onEdit,
}: { order: Order; t: ReturnType<typeof useTranslations>; onEdit: (o: Order) => void }) {
  const status = order.status as OrderStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const step = progressStep(order.status);
  const isCancelled = order.status === "cancelled";
  const items = order.items ?? [];
  const hasItems = items.length > 0;
  const itemCount = hasItems ? items.length : order.recipe ? 1 : 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group bg-card border rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
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
          <StatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} />
        </div>

        {/* Customer info */}
        {order.user && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-2.5 min-w-0">
            <Users className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span className="font-medium text-foreground truncate">{order.user.name}</span>
            <span className="text-muted-foreground/60 truncate">· {order.user.email}</span>
          </p>
        )}

        {/* Stat strip */}
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
              {order.invoice?.due_date
                ? new Date(order.invoice.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                : "—"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="flex items-center gap-1 mt-2.5">
            {STATUS_PIPELINE.map((s, idx) => (
              <div
                key={s}
                className={cn("flex-1 h-1 rounded-full transition-colors", idx <= step ? style.bar : "bg-border")}
              />
            ))}
          </div>
        )}

        {/* Items accordion */}
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
                items.map((item) => <RecipeBlock key={item.id} item={item} compact />)
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

        {/* Footer: address + actions */}
        {order.delivery_address && (
          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 mt-2.5 line-clamp-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
            {order.delivery_address}
          </p>
        )}

        <div className="flex gap-2 pt-2.5 mt-auto border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onEdit(order)}
          >
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

/**
 * Compact admin list row for an order.
 *
 * @param order - Order data.
 * @param t - Orders translation function.
 * @param onEdit - Opens the status update modal.
 */
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
            <StatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} />
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

      {/* Items accordion toggle */}
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
            items.map((item) => <RecipeBlock key={item.id} item={item} compact />)
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
 * Admin orders management page.
 * Stat chips, search, status filter, card/list view toggle, status update modal.
 *
 * @returns The admin orders management page element.
 */
export default function AdminOrdersPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");

  const { orders, isLoading, updateOrder, isUpdating } = useOrders();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const statusLabel = (s: string) => t(`status_${s}` as `status_${OrderStatus}`);

  const filtered = useMemo<Order[]>(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(o.id).includes(q) ||
        (o.user?.name?.toLowerCase().includes(q) ?? false) ||
        (o.user?.email?.toLowerCase().includes(q) ?? false) ||
        (o.pet?.name?.toLowerCase().includes(q) ?? false) ||
        (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false) ||
        (o.delivery_address?.toLowerCase().includes(q) ?? false);
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

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

  const isFiltering = search !== "" || filterStatus !== "all";
  const viewToggleLabels = { grid: tCommon("grid"), list: tCommon("list") };

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

      {/* ── Stat chips ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_VALUES.map((s) => {
          const style = STATUS_STYLE[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={cn(
                "bg-card border rounded-xl p-3 text-center transition-all hover:border-primary/50 hover:shadow-sm",
                filterStatus === s && "border-primary shadow-sm"
              )}
            >
              <span className={`text-lg font-bold block ${style.dot.replace("bg-", "text-")}`}>
                {countByStatus[s] ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight block mt-0.5">
                {statusLabel(s)}
              </span>
            </button>
          );
        })}
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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 flex-1 sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("all_statuses")} ({countByStatus.all})</option>
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)} ({countByStatus[s] ?? 0})
                </option>
              ))}
            </select>
          </div>
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
            <FilterX className="w-7 h-7 opacity-40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{tCommon("no_results")}</p>
            <p className="text-sm mt-1">{tCommon("adjust_filters")}</p>
          </div>
          {isFiltering && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); }}>
              {tCommon("clear_filters")}
            </Button>
          )}
        </div>

      ) : (
        <>
          <p className="text-sm text-muted-foreground px-1">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? t("orders_found_singular") : t("orders_found_plural")}
          </p>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((order) => (
                <AdminOrderCard key={order.id} order={order} t={t} onEdit={openEditModal} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((order) => (
                <AdminOrderRow key={order.id} order={order} t={t} onEdit={openEditModal} />
              ))}
            </div>
          )}
        </>
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
            <p><span className="text-muted-foreground">{t("pet")}:</span> <span className="font-medium">{selectedOrder?.items?.map(i => i.pet?.name).filter(Boolean).join(", ") || selectedOrder?.pet?.name || "—"}</span></p>
            <p><span className="text-muted-foreground">{t("total")}:</span> <span className="font-bold text-primary">R$ {Number(selectedOrder?.total_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("current_status")}:</span>
              {selectedOrder && (
                <StatusBadge status={selectedOrder.status} label={statusLabel(selectedOrder.status)} />
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
                      ? `${STATUS_STYLE[s].badge} border-2`
                      : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", newStatus === s ? STATUS_STYLE[s].dot : "bg-muted-foreground/30")} />
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
