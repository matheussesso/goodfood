"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import type { OrderStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import type { DashboardRecentOrder } from "@/hooks/useDashboard";

/**
 * The latest orders, each linking to its detail page.
 *
 * @param orders - Up to five recent orders.
 */
export function RecentOrders({ orders }: { orders: DashboardRecentOrder[] }) {
  const t = useTranslations("Dashboard");
  const tOrders = useTranslations("Orders");
  const format = useFormatter();

  return (
    <section aria-labelledby="dashboard-recent" className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 id="dashboard-recent" className="text-base font-semibold">
          {t("section_recent")}
        </h2>
        {orders.length > 0 && (
          <Link href="/orders" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t("view_all")} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("no_recent_orders")}</p>
      ) : (
        <ul className="divide-y">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="flex min-h-[56px] flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-muted/30">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {tOrders("order_number")}
                    {order.id}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {format.dateTime(new Date(order.created_at), { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                    {t("order_items", { count: order.items_count })}
                  </span>
                </span>
                <OrderStatusBadge status={order.status} label={tOrders(`status_${order.status}` as `status_${OrderStatus}`)} />
                <span className="w-24 text-right text-sm font-bold text-primary">R$ {formatBRL(order.total_price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
