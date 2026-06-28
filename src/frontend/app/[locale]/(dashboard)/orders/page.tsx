"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useOrders, Order, OrderItem } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  FilterX,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ExternalLink,
  Salad,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_PIPELINE = [
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

const ALL_STATUSES = [...STATUS_PIPELINE, "cancelled"] as const;
type OrderStatus = (typeof ALL_STATUSES)[number];

const STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string; bar: string }> = {
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",            dot: "bg-amber-400",   bar: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",                  dot: "bg-blue-400",    bar: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",      dot: "bg-violet-400",  bar: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                       dot: "bg-sky-400",     bar: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                       dot: "bg-red-400",     bar: "bg-red-400" },
};

function progressStep(status: string): number {
  return STATUS_PIPELINE.indexOf(status as (typeof STATUS_PIPELINE)[number]);
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
 * Recipe item block — shows name (clickable), pet, duration, portions, ingredient count.
 * Used in both card grid and list views.
 *
 * @param item - The OrderItem to render.
 * @param compact - When true renders a single-line compact version for list rows.
 */
function RecipeBlock({ item, compact = false }: { item: OrderItem; compact?: boolean }) {
  const tCat = useTranslations("Catalog");
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;

  const stats = item.recipe && (
    <div className="flex items-center divide-x divide-border text-[11px] text-muted-foreground flex-wrap">
      {item.recipe.duration_days && (
        <span className="flex items-center gap-1 pr-2">
          <Clock className="w-3 h-3" />
          {item.recipe.duration_days} {tCat("days")}
        </span>
      )}
      {item.recipe.daily_portions && (
        <span className="flex items-center gap-1 px-2">
          <Salad className="w-3 h-3" />
          {item.recipe.daily_portions} {tCat("daily_portions").toLowerCase()}
        </span>
      )}
      {item.recipe.ingredients && item.recipe.ingredients.length > 0 && (
        <span className="flex items-center gap-1 pl-2">
          <Layers className="w-3 h-3" />
          {item.recipe.ingredients.length} {tCat("ingredients").toLowerCase()}
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
            {item.recipe?.name ?? `Receita #${item.recipe_id}`}
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
      {/* Recipe name — clickable */}
      <Link
        href={`/recipes/${item.recipe_id}`}
        className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {item.recipe?.name ?? `Receita #${item.recipe_id}`}
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
            <PetIcon className="w-3 h-3" />
            {item.pet.name}
          </p>
        )}
        {stats}
      </div>
    </div>
  );
}

/**
 * Order card for the 3-column grid view — compact vertical layout.
 *
 * @param order - Order data.
 * @param t - Orders translation function.
 */
function OrderCard({ order, t }: { order: Order; t: ReturnType<typeof useTranslations> }) {
  const status = order.status as OrderStatus;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const step = progressStep(order.status);
  const isCancelled = order.status === "cancelled";
  const hasItems = !!(order.items && order.items.length > 0);

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden hover:border-primary/30 transition-colors flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm leading-snug">
                {t("order_number")}{order.id}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
        </div>

        <p className="text-xl font-bold text-primary mt-3">
          R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      {!isCancelled && (
        <div className="px-4 py-2.5 bg-muted/20 border-b">
          <div className="flex items-center gap-1">
            {STATUS_PIPELINE.map((s, idx) => (
              <div
                key={s}
                className={cn("flex-1 h-1 rounded-full transition-colors", idx <= step ? style.bar : "bg-border")}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Recipe blocks ───────────────────────────────────── */}
      <div className="px-4 py-4 space-y-2 flex-1">
        {hasItems
          ? order.items!.map((item) => <RecipeBlock key={item.id} item={item} />)
          : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              {order.recipe?.name ?? "—"}
            </div>
          )
        }
      </div>

      {/* ── Footer: address + view link ─────────────────────────────── */}
      <div className="px-4 pb-4 mt-auto space-y-2">
        {order.delivery_address && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-3 border-t line-clamp-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
            {order.delivery_address}
          </p>
        )}
        <Link href={`/orders/${order.id}`} className={order.delivery_address ? "" : "block pt-3 border-t"}>
          <Button variant="ghost" size="sm" className="w-full text-xs gap-1 h-8">
            {t("view_detail")} <ChevronRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Compact list row for an order — includes recipe blocks with full detail.
 *
 * @param order - Order data.
 * @param t - Orders translation function.
 */
function OrderRow({ order, t }: { order: Order; t: ReturnType<typeof useTranslations> }) {
  const hasItems = !!(order.items && order.items.length > 0);

  return (
    <div className="bg-card border rounded-xl hover:border-primary/30 transition-colors overflow-hidden">
      {/* Main row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{t("order_number")}{order.id}</span>
            <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
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

      {/* Recipe details */}
      {hasItems && (
        <div className="border-t bg-muted/10 px-4 py-3 divide-y divide-border/50">
          {order.items!.map((item) => (
            <RecipeBlock key={item.id} item={item} compact />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Customer orders page — 3-column grid or list view, with search and status filter.
 *
 * @returns The orders list page element.
 */
export default function OrdersPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");

  const { orders, isLoading } = useOrders();

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = useMemo<Order[]>(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(o.id).includes(q) ||
        (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false) ||
        (o.recipe?.name?.toLowerCase().includes(q) ?? false) ||
        (o.delivery_address?.toLowerCase().includes(q) ?? false);
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  const activeFiltered = filtered.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const pastFiltered   = filtered.filter((o) =>  ["delivered", "cancelled"].includes(o.status));

  const hasOrders  = !!(orders && orders.length > 0);
  const noResults  = hasOrders && filtered.length === 0;
  const isFiltering = search !== "" || filterStatus !== "all";

  function clearFilters() {
    setSearch("");
    setFilterStatus("all");
  }

  /**
   * Desktop / mobile view-mode toggle button pair.
   *
   * @param mobile - When true renders the full-width mobile variant.
   */
  const ViewToggle = ({ mobile }: { mobile?: boolean }) => (
    <div className={cn("flex border rounded-md h-10 shrink-0", mobile ? "w-full sm:hidden" : "hidden sm:flex")}>
      <button
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

  /** Renders a section (active or history) in the correct view mode. */
  function Section({ orders: list, label, pulse }: { orders: Order[]; label: string; pulse?: boolean }) {
    if (list.length === 0) return null;
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          {pulse && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          <h2 className={cn(
            "text-sm font-semibold text-muted-foreground uppercase tracking-wider",
            !pulse && "border-b pb-2 w-full"
          )}>
            {label} ({list.length})
          </h2>
        </div>

        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((order) => <OrderCard key={order.id} order={order} t={t} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((order) => <OrderRow key={order.id} order={order} t={t} />)}
          </div>
        )}
      </section>
    );
  }

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

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      {hasOrders && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("customer_search_placeholder")}
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
                  <option value="all">{t("all_statuses")}</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`status_${s}` as any)}</option>
                  ))}
                </select>
              </div>
              <ViewToggle />
            </div>
          </div>
          <ViewToggle mobile />
        </>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">{t("loading")}</span>
        </div>

      ) : !hasOrders ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("no_orders_yet")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{t("no_orders_yet_desc")}</p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-2"><Plus className="w-4 h-4" /> {t("create_first_order")}</Button>
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
          <Section orders={activeFiltered} label={t("in_progress")} pulse />
          <Section orders={pastFiltered}   label={t("history")} />
        </div>
      )}
    </div>
  );
}
