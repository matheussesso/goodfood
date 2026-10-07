"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import type { OrderStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { OrderStatusTimeline } from "@/features/orders/components/OrderStatusTimeline";
import type { Order } from "@/hooks/useOrders";

/**
 * The order currently in flight, with its status timeline — or an empty state
 * pointing to a new order.
 *
 * @param order - The in-progress order, or null.
 */
export function CurrentOrderCard({ order }: { order: Order | null }) {
  const t = useTranslations("Dashboard");
  const tOrders = useTranslations("Orders");
  const label = (status: string) => tOrders(`status_${status}` as `status_${OrderStatus}`);

  return (
    <section aria-labelledby="dashboard-current-order" className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
      <h2 id="dashboard-current-order" className="mb-4 flex items-center gap-2 text-base font-semibold">
        <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" /> {t("section_current_order")}
      </h2>

      {order ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">
                {tOrders("order_number")}
                {order.id}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("order_items", { count: order.items?.length ?? 0 })} · R$ {formatBRL(order.total_price)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} label={label(order.status)} />
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[420px]">
              <OrderStatusTimeline status={order.status} labelFor={label} />
            </div>
          </div>
          <Link href={`/orders/${order.id}`} className="mt-auto">
            <Button variant="outline" className="w-full">
              {t("view_order")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="font-medium text-foreground">{t("no_current_order")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{t("no_current_order_desc")}</p>
          <Link href="/orders/new">
            <Button>{t("qa_new_order")}</Button>
          </Link>
        </div>
      )}
    </section>
  );
}
