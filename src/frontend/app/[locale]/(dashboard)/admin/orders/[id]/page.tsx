"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { ArrowLeft, ShoppingBag, Calendar, MapPin, UtensilsCrossed, Loader2, DollarSign, Info, Users, Settings } from "lucide-react";
import { useOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { OrderItemDetail } from "@/features/orders/components/OrderItemDetail";
import { OrderStatusTimeline } from "@/features/orders/components/OrderStatusTimeline";

/**
 * Admin order detail page.
 * Shows status timeline, recipe blocks with ingredients, customer info,
 * delivery address and inline status update form.
 *
 * @returns The admin order detail page element.
 */
export default function AdminOrderDetailPage() {
  const t = useTranslations("Orders");
  const tCommon = useTranslations("Common");
  const tAdmin = useTranslations("admin");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { order, isLoading, error, updateOrder, isUpdating } = useOrder(id);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const currentStatus = order?.status ?? "";
  const effectiveSelected = selectedStatus || currentStatus;

  async function handleUpdateStatus() {
    if (!order || effectiveSelected === order.status) return;
    await updateOrder({ status: effectiveSelected });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">{t("loading")}</span>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("order_not_found")}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t("order_not_found_desc")}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {tCommon("back")}
        </Button>
      </div>
    );
  }

    const isCancelled = order.status === "cancelled";
  const hasItems = !!(order.items && order.items.length > 0);

  return (
    <div className="space-y-6 mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("order_number")}{order.id}
              </h1>
              <OrderStatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} size="md" />
            </div>
            {order.user && (
              <p className="text-muted-foreground mt-0.5 text-sm flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {order.user.name}
                <span className="text-muted-foreground/60">· {order.user.email}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Calendar,
            label: t("order_date"),
            value: new Date(order.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            color: "text-primary bg-primary/10",
          },
          {
            icon: DollarSign,
            label: t("total"),
            value: `R$ ${Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: "text-amber-600 bg-amber-500/10",
          },
          {
            icon: UtensilsCrossed,
            label: t("recipe"),
            value: hasItems
              ? `${order.items!.length} ${
                  order.items!.length === 1 ? t("items_count") : t("items_count_plural")
                }`
              : "—",
            color: "text-violet-600 bg-violet-500/10",
          },
          {
            icon: ShoppingBag,
            label: tCommon("status"),
            value: t(`status_${order.status}` as `status_${OrderStatus}`),
            color: "text-blue-600 bg-blue-500/10",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="font-semibold text-sm text-foreground truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status timeline */}
          {!isCancelled ? (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("order_status_section")}</h3>
              </div>
              <div className="px-5 py-7">
                <OrderStatusTimeline status={order.status} labelFor={(s) => t(`status_${s}` as `status_${OrderStatus}`)} />
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {t("status_cancelled")}
              </p>
            </div>
          )}

          {/* Recipes */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("order_items_label")}</h3>
              {hasItems && (
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {order.items!.length}{" "}
                  {order.items!.length === 1 ? t("items_count") : t("items_count_plural")}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {hasItems ? (
                order.items!.map((item) => <OrderItemDetail key={item.id} item={item} />)
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {order.recipe?.name ?? "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Status update */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("update_status")}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t("current_status")}
                </p>
                <OrderStatusBadge status={order.status} label={t(`status_${order.status}` as `status_${OrderStatus}`)} size="md" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {t("new_status")}
                </label>
                <select
                  value={effectiveSelected}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status_${s}` as `status_${OrderStatus}`)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleUpdateStatus}
                disabled={isUpdating || effectiveSelected === order.status}
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("save_status")}
              </Button>
            </div>
          </div>

          {/* Customer info */}
          {order.user && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{t("order_customer_section")}</h3>
              </div>
              <div className="divide-y divide-border/50 text-sm">
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-muted-foreground">{tAdmin("name")}</span>
                  <span className="font-medium text-foreground text-right">{order.user.name}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-muted-foreground">{tAdmin("email")}</span>
                  <span className="font-medium text-foreground text-right text-xs">{order.user.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("order_summary")}</h3>
            </div>
            <div className="divide-y divide-border/50 text-sm">
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("order_date")}</span>
                <span className="font-medium text-foreground text-right">
                  {new Date(order.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-muted-foreground">{t("recipe")}</span>
                <span className="font-medium text-foreground">
                  {hasItems
                    ? `${order.items!.length} ${
                        order.items!.length === 1 ? t("items_count") : t("items_count_plural")
                      }`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <span className="font-semibold text-foreground">{t("total")}</span>
                <span className="text-xl font-bold text-primary">
                  R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("delivery_address_detail")}</h3>
            </div>
            <div className="px-5 py-4">
              {order.delivery_address ? (
                <p className="text-sm text-foreground leading-relaxed">{order.delivery_address}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("no_delivery_address")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
