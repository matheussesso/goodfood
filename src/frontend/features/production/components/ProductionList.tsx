"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Factory, Users } from "lucide-react";
import type { Order } from "@/hooks/useOrders";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/order-status";
import {
  PHASES,
  PHASE_LABEL_KEYS,
  PHASE_STYLE,
  computeCycleDates,
  getPhaseDate,
  type Phase,
  type PhaseEntry,
} from "@/features/production/cycle";

interface ProductionListProps {
  /** Entries of the visible month (one per order and selected phase). */
  entries: PhaseEntry[];
  selectedOrderId: number | null;
  onSelectOrder: (order: Order) => void;
}

/**
 * List alternative to the calendar. Each row is an order seen under one phase,
 * with that phase's date and the four cycle dates (the row's phase in bold).
 *
 * @param entries - Entries of the visible month.
 * @param selectedOrderId - Order currently open in the detail panel.
 * @param onSelectOrder - Opens an order's detail panel.
 */
export function ProductionList({ entries, selectedOrderId, onSelectOrder }: ProductionListProps) {
  const t = useTranslations("Production");
  const tOrders = useTranslations("Orders");
  const format = useFormatter();
  const shortDate = (date: Date) => format.dateTime(date, { day: "2-digit", month: "2-digit" });

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card py-16 text-center text-muted-foreground">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
          <Factory className="h-7 w-7 opacity-30" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">{t("no_orders_month")}</p>
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase) || a.order.id - b.order.id
  );

  return (
    <ul className="space-y-3">
      {sorted.map(({ order, phase, date }) => {
        const { Icon, tileColor } = PHASE_STYLE[phase];
        const cycle = computeCycleDates(order);
        const milestones: { phase: Phase; date: Date }[] = [
          { phase: "order_placed", date: getPhaseDate(order, "order_placed") },
          { phase: "reposicao", date: cycle.reposicao },
          { phase: "producao", date: cycle.producao },
          { phase: "entrega", date: cycle.entrega },
        ];

        return (
          <li key={`${order.id}-${phase}`}>
            <button
              type="button"
              onClick={() => onSelectOrder(order)}
              className={cn(
                "w-full overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-primary/30",
                selectedOrderId === order.id && "border-primary ring-1 ring-primary"
              )}
            >
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", tileColor)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {tOrders("order_number")}
                      {order.id}
                    </span>
                    <OrderStatusBadge status={order.status} label={tOrders(`status_${order.status}` as `status_${OrderStatus}`)} />
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", tileColor)}>{t(PHASE_LABEL_KEYS[phase])}</span>
                  </div>
                  {order.user && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" aria-hidden="true" /> {order.user.name}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {milestones.map((milestone) => {
                      const { Icon: MilestoneIcon } = PHASE_STYLE[milestone.phase];
                      return (
                        <span
                          key={milestone.phase}
                          title={t(PHASE_LABEL_KEYS[milestone.phase])}
                          className={cn("flex items-center gap-1", milestone.phase === phase && "font-bold text-foreground")}
                        >
                          <MilestoneIcon className="h-3 w-3" aria-hidden="true" />
                          {shortDate(milestone.date)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-1 sm:flex-col sm:items-end">
                  <p className="text-lg font-bold text-primary tabular-nums">R$ {formatBRL(order.total_price)}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {format.dateTime(date, { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
