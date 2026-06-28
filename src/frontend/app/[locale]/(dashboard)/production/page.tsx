"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Factory,
  ShoppingBag,
  Package,
  UtensilsCrossed,
  Truck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
  MapPin,
  Dog,
  Cat,
  Clock,
  Salad,
  ExternalLink,
  List as ListIcon,
  CalendarDays,
  Filter,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useOrders, Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "order_placed" | "reposicao" | "producao" | "entrega";
type ViewMode = "calendar" | "list";

interface CycleDates {
  reposicao: Date;
  producao: Date;
  entrega: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Computes the production cycle dates for an order.
 * If the order has a `scheduled_reposicao_date` override set by an admin drag,
 * that date is used as the reposição anchor instead of the computed default.
 *
 * Default cycle: orders placed up to Sunday → Reposição next Monday →
 * Produção Tuesday (+1) → Entrega following Monday (+7).
 *
 * @param order - The order to compute cycle dates for.
 * @returns The three cycle milestone dates.
 */
function computeCycleDates(order: Order): CycleDates {
  let reposicao: Date;

  if (order.scheduled_reposicao_date) {
    // Slice first 10 chars to handle any format: "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", ISO
    const datePart = String(order.scheduled_reposicao_date).slice(0, 10);
    const [y, m, d] = datePart.split("-").map(Number);
    reposicao = new Date(y, m - 1, d);
  } else {
    const created = new Date(order.created_at);
    created.setHours(0, 0, 0, 0);
    const day = created.getDay();
    // Sunday=+1, Monday=+7 (next week), Tue–Sat = 8-day
    const daysToMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
    reposicao = new Date(created);
    reposicao.setDate(created.getDate() + daysToMonday);
  }

  const producao = new Date(reposicao);
  producao.setDate(reposicao.getDate() + 1);

  const entrega = new Date(reposicao);
  entrega.setDate(reposicao.getDate() + 7);

  return { reposicao, producao, entrega };
}

/** Returns the calendar date an order falls on for the given phase. */
function getPhaseDate(order: Order, phase: Phase): Date {
  const placed = new Date(order.created_at);
  placed.setHours(0, 0, 0, 0);
  const { reposicao, producao, entrega } = computeCycleDates(order);
  switch (phase) {
    case "order_placed": return placed;
    case "reposicao":    return reposicao;
    case "producao":     return producao;
    case "entrega":      return entrega;
  }
}

/** Returns whether a weekday (0=Sun) should be highlighted for the active phase. */
function isHighlightDay(weekday: number, phase: Phase): boolean {
  if (phase === "reposicao" || phase === "entrega") return weekday === 1;
  if (phase === "producao") return weekday >= 2 && weekday <= 6;
  return false;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/** Builds a Sun-aligned month grid (null = padding cell). */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const cells: (Date | null)[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASES: Phase[] = ["order_placed", "reposicao", "producao", "entrega"];

const PHASE_STYLE: Record<Phase, {
  Icon: typeof ShoppingBag;
  chipActive: string;
  chipInactive: string;
  highlight: string;
  tileColor: string;
  dotColor: string;
}> = {
  order_placed: {
    Icon: ShoppingBag,
    chipActive: "bg-primary text-primary-foreground border-primary",
    chipInactive: "text-muted-foreground border-border hover:bg-muted",
    highlight: "",
    tileColor: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
    dotColor: "bg-primary",
  },
  reposicao: {
    Icon: Package,
    chipActive: "bg-amber-500 text-white border-amber-500",
    chipInactive: "text-muted-foreground border-border hover:bg-muted",
    highlight: "bg-amber-50 dark:bg-amber-950/20",
    tileColor: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-400",
  },
  producao: {
    Icon: UtensilsCrossed,
    chipActive: "bg-violet-600 text-white border-violet-600",
    chipInactive: "text-muted-foreground border-border hover:bg-muted",
    highlight: "bg-violet-50 dark:bg-violet-950/20",
    tileColor: "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    dotColor: "bg-violet-400",
  },
  entrega: {
    Icon: Truck,
    chipActive: "bg-emerald-600 text-white border-emerald-600",
    chipInactive: "text-muted-foreground border-border hover:bg-muted",
    highlight: "bg-emerald-50 dark:bg-emerald-950/20",
    tileColor: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",    dot: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",         dot: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400",              dot: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",              dot: "bg-red-400" },
};

const STATUS_VALUES = [
  "pending", "in_production", "ready", "out_for_delivery", "delivered", "cancelled",
] as const;

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

// ─── OrderDetailPanel ─────────────────────────────────────────────────────────

/**
 * Slide-in detail panel shown when an order is selected.
 * Displays the full cycle timeline, order info, items, and inline status update.
 *
 * @param order - The selected order.
 * @param onClose - Callback to close the panel.
 * @param onUpdateStatus - Callback to save a new status.
 * @param isUpdating - Whether a status update request is in flight.
 */
function OrderDetailPanel({
  order,
  onClose,
  onUpdateStatus,
  isUpdating,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
  isUpdating: boolean;
}) {
  const t     = useTranslations("Orders");
  const tProd = useTranslations("Production");
  const tCat  = useTranslations("Catalog");

  const [localStatus, setLocalStatus] = useState(order.status);
  const placed = new Date(order.created_at);
  placed.setHours(0, 0, 0, 0);
  const { reposicao, producao, entrega } = computeCycleDates(order);
  const hasItems = !!(order.items?.length);

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const phaseDates = [
    { key: "order_placed" as Phase, date: placed,    Icon: ShoppingBag,    label: tProd("phase_order_placed") },
    { key: "reposicao"    as Phase, date: reposicao, Icon: Package,         label: tProd("phase_reposicao")    },
    { key: "producao"     as Phase, date: producao,  Icon: UtensilsCrossed, label: tProd("phase_producao")     },
    { key: "entrega"      as Phase, date: entrega,   Icon: Truck,           label: tProd("phase_entrega")      },
  ];

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">
            {tProd("order_detail_title")} — {t("order_number")}{order.id}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Cycle timeline */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {tProd("cycle_phase")}
          </p>
          <div className="flex flex-wrap gap-2">
            {phaseDates.map(({ key, date, Icon, label }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-xs bg-muted/40 border rounded-lg px-3 py-1.5"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-semibold text-foreground">{fmt(date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Order info (left 2/3) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="border rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-muted/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("order_number")}{order.id}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      {" às "}
                      {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40 text-xs">
                {order.user && (
                  <div className="px-4 py-3">
                    <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                      {tProd("customer")}
                    </p>
                    <p className="font-semibold text-foreground">{order.user.name}</p>
                    <p className="text-muted-foreground truncate">{order.user.email}</p>
                  </div>
                )}
                <div className="px-4 py-3">
                  <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                    {t("total")}
                  </p>
                  <p className="font-bold text-primary text-sm">
                    R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-muted-foreground">
                    {hasItems
                      ? `${order.items!.length} ${
                          order.items!.length === 1 ? t("items_count") : t("items_count_plural")
                        }`
                      : "—"}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                    {t("order_date")}
                  </p>
                  <p className="font-semibold text-foreground">{fmt(placed)}</p>
                  <p className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                    {tProd("observations")}
                  </p>
                  <p className="text-muted-foreground italic text-[11px]">
                    {tProd("no_observations")}
                  </p>
                </div>
              </div>

              {/* Items */}
              {hasItems && (
                <div className="px-4 pb-4 pt-2 space-y-2 border-t">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {tProd("items_label")}
                  </p>
                  {order.items!.map((item) => {
                    const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 bg-muted/30 rounded-lg px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1 text-sm font-semibold text-foreground">
                            <span className="line-clamp-1">
                              {item.recipe?.name ?? `Receita #${item.recipe_id}`}
                            </span>
                            {item.pet && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-xs font-normal text-muted-foreground flex items-center gap-0.5">
                                  <PetIcon className="w-3 h-3" /> {item.pet.name}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center flex-wrap gap-x-2">
                            {item.recipe?.duration_days && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.recipe.duration_days} {tCat("days")}
                              </span>
                            )}
                            {item.recipe?.daily_portions && (
                              <span className="flex items-center gap-1">
                                <Salad className="w-3 h-3" /> {item.recipe.daily_portions} {tCat("daily_portions").toLowerCase()}
                              </span>
                            )}
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </p>
                        </div>
                        <Link href={`/recipes/${item.recipe_id}`} className="shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                            {tProd("view_recipe_btn")} <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {order.delivery_address && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
                {order.delivery_address}
              </div>
            )}
          </div>

          {/* Status update (right 1/3) */}
          <div className="lg:col-span-1">
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("update_status")}
              </p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">{t("current_status")}</p>
                <StatusBadge status={order.status} label={t(`status_${order.status}` as any)} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {t("new_status")}
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status_${s}` as any)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                className="w-full gap-1.5"
                onClick={() => onUpdateStatus(localStatus)}
                disabled={isUpdating || localStatus === order.status}
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("save_status")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

/**
 * Production page — shows orders positioned in a weekly production cycle.
 * Admins and producers can view orders by cycle phase (calendar or list),
 * update order status, expand busy calendar days, and drag orders to reschedule.
 *
 * @returns The production management page element.
 */
export default function ProductionPage() {
  const t       = useTranslations("Orders");
  const tProd   = useTranslations("Production");
  const tCommon = useTranslations("Common");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { orders, isLoading, updateOrder, isUpdating } = useOrders();

  const [phase,         setPhase]         = useState<Phase>("order_placed");
  const [viewMode,      setViewMode]      = useState<ViewMode>("calendar");
  const [year,          setYear]          = useState(today.getFullYear());
  const [month,         setMonth]         = useState(today.getMonth());
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Expand/collapse state: Set of "year-month-day" keys
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Drag-and-drop state
  const [draggingOrderId, setDraggingOrderId] = useState<number | null>(null);
  const [dragOverDay,     setDragOverDay]     = useState<number | null>(null);
  const dragCounter = useRef<Record<number, number>>({});

  // Month navigation
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedOrder(null);
    setExpandedDays(new Set());
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedOrder(null);
    setExpandedDays(new Set());
  }

  // Calendar grid (Sun-aligned)
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Weekday labels
  const weekdays = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const d = new Date(2024, 0, 7 + i);
        return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
          .format(d)
          .slice(0, 3)
          .toUpperCase()
          .replace(".", "");
      }),
    []
  );

  // Month title
  const monthTitle = useMemo(() => {
    const raw = new Date(year, month, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [year, month]);

  // Phase label helper
  const phaseLabel = (p: Phase) => {
    const keys: Record<Phase, string> = {
      order_placed: "phase_order_placed",
      reposicao:    "phase_reposicao",
      producao:     "phase_producao",
      entrega:      "phase_entrega",
    };
    return tProd(keys[p] as any);
  };

  // Filtered orders
  const filteredOrders = useMemo<Order[]>(() => {
    if (!orders) return [];
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const matchSearch =
        !q ||
        String(o.id).includes(q) ||
        (o.user?.name?.toLowerCase().includes(q) ?? false) ||
        (o.user?.email?.toLowerCase().includes(q) ?? false) ||
        (o.items?.some((i) => i.recipe?.name?.toLowerCase().includes(q)) ?? false);
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  // Orders in the current month/year for the selected phase
  const monthOrders = useMemo<Order[]>(() => {
    return filteredOrders.filter((o) => {
      const d = getPhaseDate(o, phase);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [filteredOrders, phase, year, month]);

  // Map: day number → orders on that day
  const dayMap = useMemo<Record<number, Order[]>>(() => {
    const map: Record<number, Order[]> = {};
    monthOrders.forEach((o) => {
      const day = getPhaseDate(o, phase).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(o);
    });
    return map;
  }, [monthOrders, phase]);

  function toggleOrder(o: Order) {
    setSelectedOrder((prev) => (prev?.id === o.id ? null : o));
  }

  async function handleUpdateStatus(status: string) {
    if (!selectedOrder) return;
    await updateOrder({ id: selectedOrder.id, status });
    setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
  }

  /**
   * Handles dropping an order tile onto a calendar day.
   * Computes the new `scheduled_reposicao_date` based on the active phase:
   * - reposicao: droppedDate IS the new reposição date
   * - producao:  new reposição = droppedDate - 1 day
   * - entrega:   new reposição = droppedDate - 7 days
   */
  async function handleDrop(orderId: number, droppedDate: Date) {
    if (phase === "order_placed") return;

    let newReposicao: Date;
    if (phase === "reposicao") {
      newReposicao = droppedDate;
    } else if (phase === "producao") {
      newReposicao = new Date(droppedDate);
      newReposicao.setDate(droppedDate.getDate() - 1);
    } else {
      // entrega
      newReposicao = new Date(droppedDate);
      newReposicao.setDate(droppedDate.getDate() - 7);
    }

    await updateOrder({ id: orderId, scheduled_reposicao_date: toDateStr(newReposicao) });
  }

  // Drag event helpers for cells (counter pattern avoids child-element flicker)
  function onCellDragEnter(dayNum: number) {
    dragCounter.current[dayNum] = (dragCounter.current[dayNum] ?? 0) + 1;
    setDragOverDay(dayNum);
  }
  function onCellDragLeave(dayNum: number) {
    dragCounter.current[dayNum] = (dragCounter.current[dayNum] ?? 1) - 1;
    if (dragCounter.current[dayNum] <= 0) {
      delete dragCounter.current[dayNum];
      setDragOverDay((prev) => (prev === dayNum ? null : prev));
    }
  }
  function onCellDrop(dayNum: number, date: Date) {
    delete dragCounter.current[dayNum];
    setDragOverDay(null);
    setDraggingOrderId(null);
    if (draggingOrderId !== null) handleDrop(draggingOrderId, date);
  }

  const phaseStyle   = PHASE_STYLE[phase];
  const PhaseIcon    = phaseStyle.Icon;
  const ordersCount  = monthOrders.length;
  const ordersLabel  =
    ordersCount === 1 ? tProd("orders_this_month_singular") : tProd("orders_this_month_plural");
  const canDragPhase = phase !== "order_placed";

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Factory className="w-7 h-7 text-primary" />
            {tProd("title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{tProd("description")}</p>
        </div>

        {/* View toggle */}
        <div className="flex border rounded-md h-10 shrink-0">
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "flex items-center gap-2 px-3 text-sm font-medium transition-colors rounded-l-md",
              viewMode === "calendar"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">{tProd("calendar_view")}</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 px-3 text-sm font-medium transition-colors rounded-r-md",
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <ListIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{tProd("list_view")}</span>
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-card border rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
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
              className="h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("all_statuses")}</option>
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {t(`status_${s}` as any)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Phase chips */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {tProd("cycle_phase")}
          </p>
          <div className="flex flex-wrap gap-2">
            {PHASES.map((p) => {
              const { Icon, chipActive, chipInactive } = PHASE_STYLE[p];
              return (
                <button
                  key={p}
                  onClick={() => { setPhase(p); setSelectedOrder(null); }}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                    phase === p ? chipActive : chipInactive
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {phaseLabel(p)}
                </button>
              );
            })}
          </div>
          {canDragPhase && viewMode === "calendar" && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <span>↔</span> {tProd("drag_to_reschedule")}
            </p>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">{tCommon("loading")}</span>
        </div>
      ) : viewMode === "calendar" ? (
        /* ── Calendar view ─────────────────────────────────────────── */
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-foreground">{monthTitle}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-0.5">
                {ordersCount > 0 ? (
                  <>
                    <span>{ordersCount} {ordersLabel}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <PhaseIcon className="w-3.5 h-3.5" />
                    <span className={cn("font-medium", phaseStyle.dotColor.replace("bg-", "text-"))}>
                      {phaseLabel(phase)}
                    </span>
                  </>
                ) : (
                  <span>{tProd("no_orders_month")}</span>
                )}
              </p>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {weekdays.map((wd) => (
              <div
                key={wd}
                className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {grid.map((date, idx) => {
              if (!date) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="min-h-[90px] border-r border-b last:border-r-0 bg-muted/5"
                  />
                );
              }

              const weekday   = date.getDay();
              const dayNum    = date.getDate();
              const dayKey    = `${year}-${month}-${dayNum}`;
              const isToday   = isSameDay(date, today);
              const isPast    = date < today;
              const highlight = isHighlightDay(weekday, phase);
              const dayOrders = dayMap[dayNum] ?? [];
              const isExpanded = expandedDays.has(dayKey);
              const overflow   = dayOrders.length - 3;
              const visibleOrders = isExpanded ? dayOrders : dayOrders.slice(0, 3);
              const isLastRow  = idx >= grid.length - 7;
              const isDragOver = canDragPhase && dragOverDay === dayNum;

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "min-h-[90px] p-1.5 border-r border-b transition-colors",
                    weekday === 6 && "border-r-0",
                    isLastRow && "border-b-0",
                    highlight ? phaseStyle.highlight : "",
                    isPast && !isToday && "opacity-60",
                    isDragOver && "ring-2 ring-inset ring-primary/50 bg-primary/5"
                  )}
                  onDragOver={canDragPhase ? (e) => e.preventDefault() : undefined}
                  onDragEnter={canDragPhase ? () => onCellDragEnter(dayNum) : undefined}
                  onDragLeave={canDragPhase ? () => onCellDragLeave(dayNum) : undefined}
                  onDrop={canDragPhase ? (e) => { e.preventDefault(); onCellDrop(dayNum, date); } : undefined}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {dayNum}
                    </span>
                    {dayOrders.length > 1 && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  {/* Order tiles */}
                  <div className="space-y-0.5">
                    {visibleOrders.map((order) => (
                      <button
                        key={order.id}
                        draggable={canDragPhase}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingOrderId(order.id);
                        }}
                        onDragEnd={() => {
                          setDraggingOrderId(null);
                          setDragOverDay(null);
                          dragCounter.current = {};
                        }}
                        onClick={() => toggleOrder(order)}
                        className={cn(
                          "w-full text-left rounded px-1.5 py-1 text-[10px] font-semibold border transition-colors leading-tight",
                          canDragPhase ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                          phaseStyle.tileColor,
                          selectedOrder?.id === order.id && "ring-1 ring-primary ring-offset-1",
                          draggingOrderId === order.id && "opacity-40 scale-95"
                        )}
                      >
                        <p className="truncate">#{order.id}</p>
                        {order.user && (
                          <p className="truncate font-normal opacity-80">{order.user.name}</p>
                        )}
                        <p className="font-bold">R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </button>
                    ))}

                    {/* Expand / collapse toggle */}
                    {overflow > 0 && !isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDays((prev) => new Set([...prev, dayKey]));
                        }}
                        className="w-full flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded py-0.5 transition-colors"
                      >
                        <ChevronDown className="w-2.5 h-2.5" />
                        +{overflow} {tProd("show_more")}
                      </button>
                    )}
                    {isExpanded && dayOrders.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDays((prev) => {
                            const next = new Set(prev);
                            next.delete(dayKey);
                            return next;
                          });
                        }}
                        className="w-full flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded py-0.5 transition-colors"
                      >
                        <ChevronUp className="w-2.5 h-2.5" />
                        {tProd("show_less")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── List view ──────────────────────────────────────────────── */
        <div className="space-y-3">
          {monthOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl gap-4 text-muted-foreground text-center">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <Factory className="w-7 h-7 opacity-30" />
              </div>
              <p className="text-sm font-medium">{tProd("no_orders_month")}</p>
            </div>
          ) : (
            monthOrders
              .slice()
              .sort(
                (a, b) =>
                  getPhaseDate(a, phase).getTime() - getPhaseDate(b, phase).getTime()
              )
              .map((order) => {
                const phaseDate = getPhaseDate(order, phase);
                const isSelected = selectedOrder?.id === order.id;
                const { reposicao, producao, entrega } = computeCycleDates(order);

                return (
                  <button
                    key={order.id}
                    onClick={() => toggleOrder(order)}
                    className={cn(
                      "w-full text-left bg-card border rounded-xl hover:border-primary/30 transition-colors overflow-hidden",
                      isSelected && "border-primary ring-1 ring-primary"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {t("order_number")}{order.id}
                          </span>
                          <StatusBadge
                            status={order.status}
                            label={t(`status_${order.status}` as any)}
                          />
                        </div>
                        {order.user && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3 shrink-0" /> {order.user.name}
                          </p>
                        )}
                        {/* Cycle dates mini-row */}
                        <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          {[
                            { Icon: ShoppingBag, d: new Date(order.created_at) },
                            { Icon: Package,         d: reposicao },
                            { Icon: UtensilsCrossed, d: producao  },
                            { Icon: Truck,           d: entrega   },
                          ].map(({ Icon, d }, i) => (
                            <span
                              key={i}
                              className={cn(
                                "flex items-center gap-1",
                                isSameDay(d, phaseDate) && "font-bold text-foreground"
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                        <p className="text-lg font-bold text-primary">
                          R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <PhaseIcon className="w-3 h-3" />
                          {phaseDate.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      )}

      {/* ── Detail panel ──────────────────────────────────────────────── */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}
