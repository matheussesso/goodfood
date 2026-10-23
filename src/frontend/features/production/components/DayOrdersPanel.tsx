"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ShoppingBag, X } from "lucide-react";
import type { Order } from "@/hooks/useOrders";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/order-status";

interface DayOrdersPanelProps {
  date: Date;
  orders: Order[];
  selectedOrderId: number | null;
  onSelectOrder: (order: Order) => void;
  onClose: () => void;
}

/**
 * Full list of the orders placed on one calendar day, with customer, time,
 * status and total. It is the readable alternative to the tiles on small
 * screens and to crowded days.
 *
 * @param date - The selected day.
 * @param orders - Orders placed that day.
 * @param selectedOrderId - Order currently open in the detail panel.
 * @param onSelectOrder - Opens an order's detail panel.
 * @param onClose - Closes this panel.
 */
export function DayOrdersPanel({ date, orders, selectedOrderId, onSelectOrder, onClose }: DayOrdersPanelProps) {
  const t = useTranslations("Production");
  const tOrders = useTranslations("Orders");
  const format = useFormatter();
  const title = format.dateTime(date, { weekday: "long", day: "2-digit", month: "long" });

  return (
    <section aria-label={t("day_orders_title", { date: title })} className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{t("day_orders_title", { date: title })}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("no_orders_day")}</p>
      ) : (
        <ul className="divide-y">
          {orders.map((order) => {
            return (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  className={cn(
                    "flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/30 sm:px-5",
                    selectedOrderId === order.id && "bg-primary/5"
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {t("placed_at_time", { time: format.dateTime(new Date(order.created_at), { hour: "2-digit", minute: "2-digit" }) })}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-primary">R$ {formatBRL(order.total_price)}</span>
                  </span>
                  <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0">
                      <span className="text-sm font-semibold text-foreground">
                        {tOrders("order_number")}
                        {order.id}
                      </span>
                      {order.user && <span className="text-sm text-muted-foreground"> · {order.user.name}</span>}
                    </span>
                    <OrderStatusBadge status={order.status} label={tOrders(`status_${order.status}` as `status_${OrderStatus}`)} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
