import { cn } from "@/lib/utils";
import { getOrderStatusStyle, getSubscriptionStatusStyle } from "@/lib/order-status";

interface StatusBadgeProps {
  /** Raw status value as returned by the API. */
  status: string;
  /** Already-translated label. */
  label: string;
  /** "sm" is the compact list size, "md" the roomier detail-page size. */
  size?: "sm" | "md";
  /** Which status vocabulary the value belongs to. */
  kind?: "order" | "subscription";
  className?: string;
}

/**
 * Colored status pill shared by every order and subscription screen.
 *
 * @param status - Raw status value.
 * @param label - Translated label shown inside the pill.
 * @param size - Visual density of the pill.
 * @param kind - Whether `status` is an order or a subscription status.
 */
export function OrderStatusBadge({ status, label, size = "sm", kind = "order", className }: StatusBadgeProps) {
  const style = kind === "order" ? getOrderStatusStyle(status) : getSubscriptionStatusStyle(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border",
        size === "md" ? "px-2.5 py-1" : "px-2.5 py-0.5",
        style.badge,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {label}
    </span>
  );
}
