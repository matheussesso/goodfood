import {
  Package,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Order } from "@/hooks/useOrders";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Weekly production cycle phase an order can be viewed under. */
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

/** Returns the calendar date an order falls on for the given phase. */
export function getPhaseDate(order: Order, phase: Phase): Date {
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
export function isHighlightDay(weekday: number, phase: Phase): boolean {
  if (phase === "reposicao" || phase === "entrega") return weekday === 1;
  if (phase === "producao") return weekday >= 2 && weekday <= 6;
  return false;
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

/** Per-phase icon and Tailwind styling for chips, calendar tiles and dots. */
export const PHASE_STYLE: Record<Phase, {
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

/** Per-status badge/dot Tailwind styling. */
export const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",    dot: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",         dot: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400",              dot: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",              dot: "bg-red-400" },
};

/** Every order status accepted by the admin status selector. */
export const STATUS_VALUES = [
  "pending", "in_production", "ready", "out_for_delivery", "delivered", "cancelled",
] as const;
