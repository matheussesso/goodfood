"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import type { Order } from "@/hooks/useOrders";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EMPTY_RANGE, isDateInRange, isSameDay, type DateRange } from "@/features/production/cycle";
import { MonthHeader } from "./MonthHeader";

/** Tiles shown per day before the "+N more" toggle (desktop). */
const VISIBLE_TILES = 3;
/** Dots shown per day on small screens. */
const VISIBLE_DOTS = 4;

interface ProductionCalendarProps {
  year: number;
  month: number;
  /** Sunday-aligned month grid (`null` = padding cell). */
  grid: (Date | null)[];
  /** Orders by day of month they were placed on, already filtered to the visible month. */
  ordersByDay: Record<number, Order[]>;
  /** Period filter; days outside it are dimmed. */
  range?: DateRange;
  selectedOrderId: number | null;
  selectedDay: number | null;
  /** Orders in the month, for the header summary. */
  ordersCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number) => void;
  onSelectOrder: (order: Order) => void;
}

/**
 * Month calendar of placed orders. Each order sits on the day it was placed,
 * as a tile with its number, customer and total; on small screens a day shows
 * dots and tapping it opens the day's list. Days outside the period filter
 * are dimmed.
 */
export function ProductionCalendar({
  year,
  month,
  grid,
  ordersByDay,
  range = EMPTY_RANGE,
  selectedOrderId,
  selectedDay,
  ordersCount,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onSelectOrder,
}: ProductionCalendarProps) {
  const t = useTranslations("Production");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const weekdays = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((i) =>
        new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(2024, 0, 7 + i)).slice(0, 3).replace(".", "")
      ),
    []
  );

  const toggleExpanded = (day: number) =>
    setExpandedDays((previous) => {
      const next = new Set(previous);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <MonthHeader year={year} month={month} ordersCount={ordersCount} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} className="border-b" />

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
          const orders = ordersByDay[day] ?? [];
          const isToday = isSameDay(date, today);
          const isPast = date < today && !isToday;
          const outOfRange = !isDateInRange(date, range);
          const isSelected = selectedDay === day;
          const isLastRow = index >= grid.length - 7;
          const expanded = expandedDays.has(day);
          const visible = expanded ? orders : orders.slice(0, VISIBLE_TILES);
          const hidden = orders.length - VISIBLE_TILES;

          return (
            <div
              key={date.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-14 cursor-pointer border-r p-1 transition-colors md:min-h-[96px] md:p-1.5",
                !isLastRow && "border-b",
                date.getDay() === 6 && "border-r-0",
                outOfRange ? "bg-muted/40 *:opacity-40" : isPast && "opacity-60",
                isSelected && "bg-primary/5 ring-2 ring-inset ring-primary/60"
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
                  aria-label={t("day_cell_label", { day, count: orders.length })}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {day}
                </button>
                {orders.length > 1 && (
                  <span className="hidden rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground md:inline">{orders.length}</span>
                )}
              </div>

              {/* Small screens: one dot per order. */}
              {orders.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-0.5 md:hidden" aria-hidden="true">
                  {orders.slice(0, VISIBLE_DOTS).map((order) => (
                    <span key={order.id} className="h-2 w-2 rounded-full bg-primary" />
                  ))}
                  {orders.length > VISIBLE_DOTS && <span className="text-[9px] font-bold text-muted-foreground">+{orders.length - VISIBLE_DOTS}</span>}
                </div>
              )}

              {/* Tablet and desktop: order tiles. */}
              <div className="hidden space-y-0.5 md:block">
                {visible.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    title={`#${order.id}${order.user ? ` · ${order.user.name}` : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectOrder(order);
                    }}
                    className={cn(
                      "w-full rounded border border-primary/20 bg-primary/10 px-1.5 py-1 text-left text-[10px] leading-tight text-primary transition-colors hover:bg-primary/20",
                      selectedOrderId === order.id && "ring-1 ring-primary ring-offset-1"
                    )}
                  >
                    <span className="flex items-center gap-1 font-bold">
                      <ShoppingBag className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">#{order.id}</span>
                      <span className="ml-auto hidden shrink-0 font-semibold tabular-nums lg:inline">{formatBRL(order.total_price)}</span>
                    </span>
                    {order.user && <span className="mt-0.5 block truncate font-normal opacity-80">{order.user.name}</span>}
                  </button>
                ))}

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
    </div>
  );
}
