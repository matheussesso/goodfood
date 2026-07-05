"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Cat,
  Clock,
  Dog,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Salad,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { computeCycleDates, Phase, STATUS_STYLE, STATUS_VALUES } from "@/features/production/cycle";

/** Small colored badge for an order status. */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

/**
 * Slide-in detail panel shown when an order is selected.
 * Displays the full cycle timeline, order info, items, and inline status update.
 *
 * @param order - The selected order.
 * @param onClose - Callback to close the panel.
 * @param onUpdateStatus - Callback to save a new status.
 * @param isUpdating - Whether a status update request is in flight.
 */
export function OrderDetailPanel({
  order,
  onClose,
  onUpdateStatus,
  isUpdating,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
  isUpdating: boolean;
}) {
  const t     = useTranslations("Orders");
  const tProd = useTranslations("Production");
  const tCat  = useTranslations("Catalog");

  const [localStatus, setLocalStatus] = useState(order.status);
  const placed = new Date(order.created_at);
  placed.setHours(0, 0, 0, 0);
  const { reposicao, producao, entrega } = computeCycleDates(order);
  const hasItems = !!(order.items?.length);

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const phaseDates = [
    { key: "order_placed" as Phase, date: placed,    Icon: ShoppingBag,    label: tProd("phase_order_placed") },
    { key: "reposicao"    as Phase, date: reposicao, Icon: Package,         label: tProd("phase_reposicao")    },
    { key: "producao"     as Phase, date: producao,  Icon: UtensilsCrossed, label: tProd("phase_producao")     },
    { key: "entrega"      as Phase, date: entrega,   Icon: Truck,           label: tProd("phase_entrega")      },
  ];

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">
            {tProd("order_detail_title")} — {t("order_number")}{order.id}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Cycle timeline */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {tProd("cycle_phase")}
          </p>
          <div className="flex flex-wrap gap-2">
            {phaseDates.map(({ key, date, Icon, label }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-xs bg-muted/40 border rounded-lg px-3 py-1.5"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-semibold text-foreground">{fmt(date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Order info (left 2/3) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="border rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-muted/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("order_number")}{order.id}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      {" às "}
                      {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} label={t(`status_${order.status}`)} />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40 text-xs">
                {order.user && (
                  <div className="px-4 py-3">
                    <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                      {tProd("customer")}
                    </p>
                    <p className="font-semibold text-foreground">{order.user.name}</p>
                    <p className="text-muted-foreground truncate">{order.user.email}</p>
                  </div>
                )}
                <div className="px-4 py-3">
                  <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                    {t("total")}
                  </p>
                  <p className="font-bold text-primary text-sm">
                    R$ {Number(order.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-muted-foreground">
                    {hasItems
                      ? `${order.items!.length} ${
                          order.items!.length === 1 ? t("items_count") : t("items_count_plural")
                        }`
                      : "—"}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                    {t("order_date")}
                  </p>
                  <p className="font-semibold text-foreground">{fmt(placed)}</p>
                  <p className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="uppercase tracking-wide text-muted-foreground mb-1 font-semibold text-[10px]">
                    {tProd("observations")}
                  </p>
                  <p className="text-muted-foreground italic text-[11px]">
                    {tProd("no_observations")}
                  </p>
                </div>
              </div>

              {/* Items */}
              {hasItems && (
                <div className="px-4 pb-4 pt-2 space-y-2 border-t">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {tProd("items_label")}
                  </p>
                  {order.items!.map((item) => {
                    const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 bg-muted/30 rounded-lg px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1 text-sm font-semibold text-foreground">
                            <span className="line-clamp-1">
                              {item.recipe?.name ?? `#${item.recipe_id}`}
                            </span>
                            {item.pet && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-xs font-normal text-muted-foreground flex items-center gap-0.5">
                                  <PetIcon className="w-3 h-3" /> {item.pet.name}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center flex-wrap gap-x-2">
                            {item.recipe?.duration_days && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.recipe.duration_days} {tCat("days")}
                              </span>
                            )}
                            {item.recipe?.daily_portions && (
                              <span className="flex items-center gap-1">
                                <Salad className="w-3 h-3" /> {item.recipe.daily_portions} {tCat("daily_portions").toLowerCase()}
                              </span>
                            )}
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </p>
                        </div>
                        <Link href={`/recipes/${item.recipe_id}`} className="shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                            {tProd("view_recipe_btn")} <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {order.delivery_address && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/60" />
                {order.delivery_address}
              </div>
            )}
          </div>

          {/* Status update (right 1/3) */}
          <div className="lg:col-span-1">
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("update_status")}
              </p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">{t("current_status")}</p>
                <StatusBadge status={order.status} label={t(`status_${order.status}`)} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {t("new_status")}
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status_${s}`)}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                className="w-full gap-1.5"
                onClick={() => onUpdateStatus(localStatus)}
                disabled={isUpdating || localStatus === order.status}
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("save_status")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
