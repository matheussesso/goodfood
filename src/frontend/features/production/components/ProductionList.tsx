"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Factory, ShoppingBag, Users } from "lucide-react";
import type { Order } from "@/hooks/useOrders";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/order-status";
import { PHASES, PHASE_ICONS, PHASE_LABEL_KEYS, getPhaseDate } from "@/features/production/cycle";

interface ProductionListProps {
  /** Orders to list, already filtered and sorted by placement date. */
  orders: Order[];
  selectedOrderId: number | null;
  onSelectOrder: (order: Order) => void;
  /** Message for an empty list (e.g. "no orders this month" or "in this period"). */
  emptyMessage: string;
}

/**
 * List alternative to the calendar: one row per placed order with customer,
 * status, total, placement date and the forecast dates of its weekly cycle.
 *
 * @param orders - Orders to list.
 * @param selectedOrderId - Order currently open in the detail panel.
 * @param onSelectOrder - Opens an order's detail panel.
 * @param emptyMessage - Shown when there is nothing to list.
 */
export function ProductionList({ orders, selectedOrderId, onSelectOrder, emptyMessage }: ProductionListProps) {
  const t = useTranslations("Production");
  const tOrders = useTranslations("Orders");
  const format = useFormatter();
  const shortDate = (date: Date) => format.dateTime(date, { day: "2-digit", month: "2-digit" });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card py-16 text-center text-muted-foreground">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
          <Factory className="h-7 w-7 opacity-30" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <button
            type="button"
            onClick={() => onSelectOrder(order)}
            className={cn(
              "w-full overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-primary/30",
              selectedOrderId === order.id && "border-primary ring-1 ring-primary"
            )}
          >
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {tOrders("order_number")}
                    {order.id}
                  </span>
                  <OrderStatusBadge status={order.status} label={tOrders(`status_${order.status}` as `status_${OrderStatus}`)} />
                </div>
                {order.user && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3 shrink-0" aria-hidden="true" /> {order.user.name}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {PHASES.map((phase) => {
                    const Icon = PHASE_ICONS[phase];
                    return (
                      <span key={phase} title={t(PHASE_LABEL_KEYS[phase])} className={cn("flex items-center gap-1", phase === "order_placed" && "font-bold text-foreground")}>
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">{t(PHASE_LABEL_KEYS[phase])}: </span>
                        {shortDate(getPhaseDate(order, phase))}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-1 sm:flex-col sm:items-end">
                <p className="text-lg font-bold text-primary tabular-nums">R$ {formatBRL(order.total_price)}</p>
                <p className="text-[11px] text-muted-foreground">{format.dateTime(new Date(order.created_at), { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
