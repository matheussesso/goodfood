"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
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
  List as ListIcon,
  CalendarDays,
  Filter,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useOrders, Order } from "@/hooks/useOrders";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Phase,
  ViewMode,
  PHASES,
  PHASE_STYLE,
  buildMonthGrid,
  computeCycleDates,
  getPhaseDate,
  isHighlightDay,
  isSameDay,
  toDateStr,
  STATUS_VALUES,
} from "@/features/production/cycle";
import { OrderDetailPanel, StatusBadge } from "@/features/production/components/OrderDetailPanel";

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
    return tProd(keys[p]);
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
            <Factory className="w-7 h-7 text-primary mb-1" />
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
                  {t(`status_${s}`)}
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
                            label={t(`status_${order.status}`)}
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
