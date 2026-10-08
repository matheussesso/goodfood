"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { Order } from "@/hooks/useOrders";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PHASE_LABEL_KEYS,
  PHASE_STYLE,
  getRescheduleAnchor,
  isHighlightDay,
  isPhaseDraggable,
  isSameDay,
  toDateStr,
  type Phase,
  type PhaseEntry,
} from "@/features/production/cycle";

/** Tiles shown per day before the "+N more" toggle (desktop). */
const VISIBLE_TILES = 3;
/** Dots shown per day on small screens. */
const VISIBLE_DOTS = 4;

interface ProductionCalendarProps {
  year: number;
  month: number;
  /** Sunday-aligned month grid (`null` = padding cell). */
  grid: (Date | null)[];
  /** Entries by day of month, already filtered to the visible month. */
  entriesByDay: Record<number, PhaseEntry[]>;
  /** Phases currently shown. */
  phases: Phase[];
  selectedOrderId: number | null;
  selectedDay: number | null;
  /** Orders in the month, for the header summary. */
  ordersCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number) => void;
  onSelectOrder: (order: Order) => void;
  /** Called with the order id and the new reposição date (`YYYY-MM-DD`) after a drop. */
  onReschedule: (orderId: number, reposicaoDate: string) => void;
}

/**
 * Month calendar of the production cycle. Orders from every selected phase are
 * drawn as colored tiles (phase icon, id, customer, total); on small screens a
 * day shows phase-colored dots and tapping it opens the day's list. Tiles of
 * reposição, produção and entrega can be dragged to reschedule the cycle.
 */
export function ProductionCalendar({
  year,
  month,
  grid,
  entriesByDay,
  phases,
  selectedOrderId,
  selectedDay,
  ordersCount,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onSelectOrder,
  onReschedule,
}: ProductionCalendarProps) {
  const t = useTranslations("Production");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState<{ orderId: number; phase: Phase } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const dragCounter = useRef<Record<number, number>>({});

  const weekdays = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((i) =>
        new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(2024, 0, 7 + i)).slice(0, 3).replace(".", "")
      ),
    []
  );

  const monthTitle = useMemo(() => {
    const raw = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [year, month]);

  // Weekday shading only makes sense when a single phase is shown.
  const singlePhase = phases.length === 1 ? phases[0] : null;
  const canDrag = phases.some(isPhaseDraggable);

  const resetDrag = () => {
    setDragging(null);
    setDragOverDay(null);
    dragCounter.current = {};
  };

  const enterCell = (day: number) => {
    dragCounter.current[day] = (dragCounter.current[day] ?? 0) + 1;
    setDragOverDay(day);
  };

  const leaveCell = (day: number) => {
    dragCounter.current[day] = (dragCounter.current[day] ?? 1) - 1;
    if (dragCounter.current[day] <= 0) {
      delete dragCounter.current[day];
      setDragOverDay((current) => (current === day ? null : current));
    }
  };

  const dropOnCell = (date: Date) => {
    const current = dragging;
    resetDrag();
    if (!current) return;
    const anchor = getRescheduleAnchor(current.phase, date);
    if (anchor) onReschedule(current.orderId, toDateStr(anchor));
  };

  const toggleExpanded = (day: number) =>
    setExpandedDays((previous) => {
      const next = new Set(previous);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-3 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label={t("prev_month")}
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-foreground">{monthTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ordersCount > 0
              ? `${ordersCount} ${ordersCount === 1 ? t("orders_this_month_singular") : t("orders_this_month_plural")}`
              : t("no_orders_month")}
          </p>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label={t("next_month")}
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b">
        {weekdays.map((weekday) => (
          <div key={weekday} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map((date, index) => {
          if (!date) {
            return <div key={`pad-${index}`} className="min-h-14 border-b border-r bg-muted/5 md:min-h-[96px]" />;
          }

          const day = date.getDate();
          const weekday = date.getDay();
          const entries = entriesByDay[day] ?? [];
          const isToday = isSameDay(date, today);
          const isPast = date < today && !isToday;
          const isSelected = selectedDay === day;
          const isLastRow = index >= grid.length - 7;
          const expanded = expandedDays.has(day);
          const visible = expanded ? entries : entries.slice(0, VISIBLE_TILES);
          const hidden = entries.length - VISIBLE_TILES;
          const shaded = singlePhase && isHighlightDay(weekday, singlePhase) ? PHASE_STYLE[singlePhase].highlight : "";

          return (
            <div
              key={date.toISOString()}
              onClick={() => onSelectDay(day)}
              onDragOver={dragging ? (event) => event.preventDefault() : undefined}
              onDragEnter={dragging ? () => enterCell(day) : undefined}
              onDragLeave={dragging ? () => leaveCell(day) : undefined}
              onDrop={
                dragging
                  ? (event) => {
                      event.preventDefault();
                      dropOnCell(date);
                    }
                  : undefined
              }
              className={cn(
                "min-h-14 cursor-pointer border-r p-1 transition-colors md:min-h-[96px] md:p-1.5",
                !isLastRow && "border-b",
                weekday === 6 && "border-r-0",
                shaded,
                isPast && "opacity-60",
                isSelected && "bg-primary/5 ring-2 ring-inset ring-primary/60",
                dragOverDay === day && "bg-primary/10 ring-2 ring-inset ring-primary/50"
              )}
            >
              <div className="flex items-center justify-between md:mb-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectDay(day);
                  }}
                  aria-pressed={isSelected}
                  aria-label={t("day_cell_label", { day, count: entries.length })}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {day}
                </button>
                {entries.length > 1 && (
                  <span className="hidden rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground md:inline">{entries.length}</span>
                )}
              </div>

              {/* Small screens: one dot per entry, colored by phase. */}
              {entries.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-0.5 md:hidden" aria-hidden="true">
                  {entries.slice(0, VISIBLE_DOTS).map(({ order, phase }) => (
                    <span key={`${order.id}-${phase}`} className={cn("h-2 w-2 rounded-full", PHASE_STYLE[phase].dotColor)} />
                  ))}
                  {entries.length > VISIBLE_DOTS && <span className="text-[9px] font-bold text-muted-foreground">+{entries.length - VISIBLE_DOTS}</span>}
                </div>
              )}

              {/* Tablet and desktop: order tiles. */}
              <div className="hidden space-y-0.5 md:block">
                {visible.map(({ order, phase }) => {
                  const { Icon, tileColor } = PHASE_STYLE[phase];
                  const draggable = isPhaseDraggable(phase);
                  return (
                    <button
                      key={`${order.id}-${phase}`}
                      type="button"
                      draggable={draggable}
                      title={`${t(PHASE_LABEL_KEYS[phase])} · #${order.id}${order.user ? ` · ${order.user.name}` : ""}`}
                      onDragStart={(event) => {
                        event.stopPropagation();
                        event.dataTransfer.effectAllowed = "move";
                        setDragging({ orderId: order.id, phase });
                      }}
                      onDragEnd={resetDrag}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className={cn(
                        "w-full rounded border px-1.5 py-1 text-left text-[10px] leading-tight transition-colors",
                        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                        tileColor,
                        selectedOrderId === order.id && "ring-1 ring-primary ring-offset-1",
                        dragging?.orderId === order.id && dragging.phase === phase && "scale-95 opacity-40"
                      )}
                    >
                      <span className="flex items-center gap-1 font-bold">
                        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">#{order.id}</span>
                        <span className="ml-auto hidden shrink-0 font-semibold tabular-nums lg:inline">{formatBRL(order.total_price)}</span>
                      </span>
                      {order.user && <span className="mt-0.5 block truncate font-normal opacity-80">{order.user.name}</span>}
                    </button>
                  );
                })}

                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExpanded(day);
                    }}
                    className="flex w-full items-center justify-center gap-0.5 rounded py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  >
                    {expanded ? <ChevronUp className="h-2.5 w-2.5" aria-hidden="true" /> : <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />}
                    {expanded ? t("show_less") : `+${hidden} ${t("show_more")}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canDrag && <p className="hidden border-t px-5 py-2 text-[11px] text-muted-foreground md:block">↔ {t("drag_to_reschedule")}</p>}
    </div>
  );
}
