import {
  Package,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Order } from "@/hooks/useOrders";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Milestone of an order's weekly production cycle (shown as information; the screen lists placed orders). */
export type Phase = "order_placed" | "reposicao" | "producao" | "entrega";

/** Production page display mode. */
export type ViewMode = "calendar" | "list";

/** The three milestone dates of an order's production cycle. */
export interface CycleDates {
  reposicao: Date;
  producao: Date;
  entrega: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a Date as a local "YYYY-MM-DD" key. */
export function toDateStr(d: Date): string {
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
export function computeCycleDates(order: Order): CycleDates {
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

/** Calendar day (midnight, local time) the order was placed on. */
export function getPlacedDate(order: Order): Date {
  const placed = new Date(order.created_at);
  placed.setHours(0, 0, 0, 0);
  return placed;
}

/** Returns the calendar date an order falls on for the given phase. */
export function getPhaseDate(order: Order, phase: Phase): Date {
  const placed = getPlacedDate(order);
  const { reposicao, producao, entrega } = computeCycleDates(order);
  switch (phase) {
    case "order_placed": return placed;
    case "reposicao":    return reposicao;
    case "producao":     return producao;
    case "entrega":      return entrega;
  }
}

/** Returns whether two dates fall on the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/** Builds a Sun-aligned month grid (null = padding cell). */
export function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const cells: (Date | null)[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Phase config ─────────────────────────────────────────────────────────────

/** Cycle phases in chronological order. */
export const PHASES: Phase[] = ["order_placed", "reposicao", "producao", "entrega"];

/** Icon of each cycle phase (detail panel and list milestones). */
export const PHASE_ICONS: Record<Phase, typeof ShoppingBag> = {
  order_placed: ShoppingBag,
  reposicao: Package,
  producao: UtensilsCrossed,
  entrega: Truck,
};

// ─── Placed orders and date range ────────────────────────────────────────────

/** Translation key (namespace `Production`) of each phase's label. */
export const PHASE_LABEL_KEYS: Record<Phase, string> = {
  order_placed: "phase_order_placed",
  reposicao: "phase_reposicao",
  producao: "phase_producao",
  entrega: "phase_entrega",
};

/** Period filter on the order placement date; `YYYY-MM-DD` bounds, both inclusive and optional. */
export interface DateRange {
  from: string | null;
  to: string | null;
}

/** No period filter. */
export const EMPTY_RANGE: DateRange = { from: null, to: null };

/** Quick period shortcuts offered next to the date fields. */
export const RANGE_PRESETS = ["last_7_days", "last_30_days", "this_month"] as const;

/** One of {@link RANGE_PRESETS}. */
export type RangePreset = (typeof RANGE_PRESETS)[number];

/** Parses a local `YYYY-MM-DD` key into a Date at midnight. */
export function parseDateStr(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whether a period bound is set. */
export function isRangeActive(range: DateRange): boolean {
  return !!(range.from || range.to);
}

/**
 * Keeps the bounds in order: when `from` is after `to` (e.g. typed by hand)
 * they are swapped. Empty strings count as unset.
 */
export function normalizeRange(range: DateRange): DateRange {
  const from = range.from || null;
  const to = range.to || null;
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
}

/**
 * Builds the period of a preset, ending today.
 *
 * @param preset - Shortcut picked by the user.
 * @param today - Reference day (defaults to now).
 */
export function presetRange(preset: RangePreset, today: Date = new Date()): DateRange {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  if (preset === "last_7_days") start.setDate(end.getDate() - 6);
  else if (preset === "last_30_days") start.setDate(end.getDate() - 29);
  else start.setDate(1);
  return { from: toDateStr(start), to: toDateStr(end) };
}

/** Which preset, if any, the range matches exactly (for the active chip). */
export function matchingPreset(range: DateRange, today: Date = new Date()): RangePreset | null {
  return RANGE_PRESETS.find((preset) => {
    const candidate = presetRange(preset, today);
    return candidate.from === range.from && candidate.to === range.to;
  }) ?? null;
}

/** Whether a calendar day falls inside the period (an unset bound is open). */
export function isDateInRange(date: Date, range: DateRange): boolean {
  const key = toDateStr(date);
  if (range.from && key < range.from) return false;
  if (range.to && key > range.to) return false;
  return true;
}

/** Orders placed inside the period, oldest first (then by id). */
export function ordersInRange(orders: Order[], range: DateRange): Order[] {
  return orders
    .filter((order) => isDateInRange(getPlacedDate(order), range))
    .sort((a, b) => getPlacedDate(a).getTime() - getPlacedDate(b).getTime() || a.id - b.id);
}

/** Orders placed in the given month. */
export function ordersInMonth(orders: Order[], year: number, month: number): Order[] {
  return orders.filter((order) => {
    const placed = getPlacedDate(order);
    return placed.getFullYear() === year && placed.getMonth() === month;
  });
}

/** Groups a month's orders by the day of month they were placed on, by id inside a day. */
export function groupOrdersByDay(orders: Order[]): Record<number, Order[]> {
  const byDay: Record<number, Order[]> = {};
  for (const order of orders) {
    (byDay[getPlacedDate(order).getDate()] ??= []).push(order);
  }
  for (const list of Object.values(byDay)) list.sort((a, b) => a.id - b.id);
  return byDay;
}

/** Month (year + 0-based month) the calendar should open on for a period, or null without bounds. */
export function rangeStartMonth(range: DateRange): { year: number; month: number } | null {
  const bound = range.from ?? range.to;
  if (!bound) return null;
  const date = parseDateStr(bound);
  return { year: date.getFullYear(), month: date.getMonth() };
}
