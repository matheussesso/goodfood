"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Factory, List as ListIcon, Loader2, Search } from "lucide-react";
import { useOrders, type Order } from "@/hooks/useOrders";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/order-status";
import {
  PHASES,
  buildMonthGrid,
  buildPhaseEntries,
  countByPhase,
  entriesInMonth,
  groupEntriesByDay,
  togglePhase,
  type Phase,
  type ViewMode,
} from "@/features/production/cycle";
import { DayOrdersPanel } from "@/features/production/components/DayOrdersPanel";
import { OrderDetailPanel } from "@/features/production/components/OrderDetailPanel";
import { PhaseFilter } from "@/features/production/components/PhaseFilter";
import { ProductionCalendar } from "@/features/production/components/ProductionCalendar";
import { ProductionList } from "@/features/production/components/ProductionList";

/**
 * Production page — shows orders positioned in the weekly production cycle.
 * One or more cycle phases can be shown together (calendar or list); orders
 * are searchable and filterable by status, a day can be opened as a full list,
 * the status can be updated and the cycle rescheduled by dragging a tile.
 *
 * @returns The production management page element.
 */
export default function ProductionPage() {
  const t = useTranslations("Orders");
  const tProd = useTranslations("Production");
  const tCommon = useTranslations("Common");

  const now = new Date();
  const { orders, isLoading, updateOrder, isUpdating } = useOrders();

  const [phases, setPhases] = useState<Phase[]>(["order_placed"]);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const filteredOrders = useMemo<Order[]>(() => {
    if (!orders) return [];
    const query = search.toLowerCase();
    return orders.filter((order) => {
      const matchStatus = filterStatus === "all" || order.status === filterStatus;
      const matchSearch =
        !query ||
        String(order.id).includes(query) ||
        (order.user?.name?.toLowerCase().includes(query) ?? false) ||
        (order.user?.email?.toLowerCase().includes(query) ?? false) ||
        (order.items?.some((item) => item.recipe?.name?.toLowerCase().includes(query)) ?? false);
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  // Every phase of every filtered order, so chip counters stay accurate for phases that are off.
  const allPhaseEntries = useMemo(() => entriesInMonth(buildPhaseEntries(filteredOrders, [...PHASES]), year, month), [filteredOrders, year, month]);
  const phaseCounts = useMemo(() => countByPhase(allPhaseEntries), [allPhaseEntries]);

  const monthEntries = useMemo(() => allPhaseEntries.filter((entry) => phases.includes(entry.phase)), [allPhaseEntries, phases]);
  const entriesByDay = useMemo(() => groupEntriesByDay(monthEntries), [monthEntries]);
  const ordersCount = useMemo(() => new Set(monthEntries.map((entry) => entry.order.id)).size, [monthEntries]);

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedOrder(null);
    setSelectedDay(null);
  };

  const selectOrder = (order: Order) => setSelectedOrder((current) => (current?.id === order.id ? null : order));
  const selectDay = (day: number) => setSelectedDay((current) => (current === day ? null : day));

  async function handleUpdateStatus(status: string) {
    if (!selectedOrder) return;
    await updateOrder({ id: selectedOrder.id, status });
    setSelectedOrder((current) => (current ? { ...current, status } : null));
  }

  const viewButton = (mode: ViewMode, label: string, Icon: typeof ListIcon, edge: string) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      className={cn(
        "flex items-center gap-2 px-3 text-sm font-medium transition-colors",
        edge,
        viewMode === mode ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground">
            <Factory className="mb-1 h-7 w-7 text-primary" aria-hidden="true" />
            {tProd("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{tProd("description")}</p>
        </div>

        <div className="flex h-10 shrink-0 rounded-md border">
          {viewButton("calendar", tProd("calendar_view"), CalendarDays, "rounded-l-md")}
          {viewButton("list", tProd("list_view"), ListIcon, "rounded-r-md")}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input placeholder={t("search_placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary sm:w-48"
            >
              <option value="all">{t("all_statuses")}</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status_${status}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PhaseFilter
          selected={phases}
          counts={phaseCounts}
          onToggle={(phase) => {
            setPhases((current) => togglePhase(current, phase));
            setSelectedOrder(null);
          }}
          onSelectAll={() => {
            setPhases([...PHASES]);
            setSelectedOrder(null);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm">{tCommon("loading")}</span>
        </div>
      ) : viewMode === "calendar" ? (
        <>
          <ProductionCalendar
            year={year}
            month={month}
            grid={grid}
            entriesByDay={entriesByDay}
            phases={phases}
            selectedOrderId={selectedOrder?.id ?? null}
            selectedDay={selectedDay}
            ordersCount={ordersCount}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
            onSelectDay={selectDay}
            onSelectOrder={selectOrder}
            onReschedule={(orderId, reposicaoDate) => updateOrder({ id: orderId, scheduled_reposicao_date: reposicaoDate })}
          />

          {selectedDay === null ? (
            <p className="text-center text-xs text-muted-foreground md:hidden">{tProd("select_day_hint")}</p>
          ) : (
            <DayOrdersPanel
              date={new Date(year, month, selectedDay)}
              entries={entriesByDay[selectedDay] ?? []}
              selectedOrderId={selectedOrder?.id ?? null}
              onSelectOrder={selectOrder}
              onClose={() => setSelectedDay(null)}
            />
          )}
        </>
      ) : (
        <ProductionList entries={monthEntries} selectedOrderId={selectedOrder?.id ?? null} onSelectOrder={selectOrder} />
      )}

      {selectedOrder && (
        <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={handleUpdateStatus} isUpdating={isUpdating} />
      )}
    </div>
  );
}
