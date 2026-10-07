/**
 * Single source of truth for order and subscription statuses: their order,
 * the progress pipeline and the Tailwind classes used to render them.
 */

/** Every status an order can have, in lifecycle order (cancelled is off-path). */
export const ORDER_STATUSES = [
  "pending_payment",
  "pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

/** A valid order status. */
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy-path statuses shown as a progress timeline (everything but "cancelled"). */
export const ORDER_PIPELINE: readonly OrderStatus[] = ORDER_STATUSES.filter(
  (status) => status !== "cancelled"
);

/** Tailwind classes for a status: pill (`badge`), indicator dot and progress bar. */
export interface StatusStyle {
  badge: string;
  dot: string;
  bar: string;
}

/** Per-status styling for orders. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, StatusStyle> = {
  pending_payment:  { badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",         dot: "bg-orange-400",  bar: "bg-orange-400" },
  pending:          { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",               dot: "bg-amber-400",   bar: "bg-amber-400" },
  in_production:    { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",                     dot: "bg-blue-400",    bar: "bg-blue-400" },
  ready:            { badge: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",         dot: "bg-violet-400",  bar: "bg-violet-400" },
  out_for_delivery: { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",                           dot: "bg-sky-400",     bar: "bg-sky-400" },
  delivered:        { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",  dot: "bg-emerald-500", bar: "bg-emerald-500" },
  cancelled:        { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                          dot: "bg-red-400",     bar: "bg-red-400" },
};

/**
 * Looks up the style for a raw status string.
 *
 * @param status - Status as returned by the API.
 * @returns The matching style, falling back to the "pending" style for unknown values.
 */
export function getOrderStatusStyle(status: string): StatusStyle {
  return ORDER_STATUS_STYLE[status as OrderStatus] ?? ORDER_STATUS_STYLE.pending;
}

/**
 * Position of a status in the progress pipeline.
 *
 * @param status - Status as returned by the API.
 * @returns Zero-based index, or -1 when the status is off-path (e.g. cancelled).
 */
export function getOrderProgressStep(status: string): number {
  return ORDER_PIPELINE.indexOf(status as OrderStatus);
}

/** Every status a subscription can have. */
export const SUBSCRIPTION_STATUSES = ["active", "paused", "cancelled"] as const;

/** A valid subscription status. */
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Per-status styling for subscriptions. */
export const SUBSCRIPTION_STATUS_STYLE: Record<SubscriptionStatus, StatusStyle> = {
  active:    { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  paused:    { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",             dot: "bg-amber-400",   bar: "bg-amber-400" },
  cancelled: { badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",                         dot: "bg-red-400",     bar: "bg-red-400" },
};

/**
 * Looks up the style for a raw subscription status string.
 *
 * @param status - Status as returned by the API.
 * @returns The matching style, falling back to the "active" style for unknown values.
 */
export function getSubscriptionStatusStyle(status: string): StatusStyle {
  return SUBSCRIPTION_STATUS_STYLE[status as SubscriptionStatus] ?? SUBSCRIPTION_STATUS_STYLE.active;
}
