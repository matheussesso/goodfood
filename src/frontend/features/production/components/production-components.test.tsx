import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Order } from "@/hooks/useOrders";
import { EMPTY_RANGE, buildMonthGrid, groupOrdersByDay, presetRange, type DateRange } from "@/features/production/cycle";
import { DateRangeFilter } from "./DateRangeFilter";
import { DayOrdersPanel } from "./DayOrdersPanel";
import { ProductionCalendar } from "./ProductionCalendar";
import { ProductionList } from "./ProductionList";

const P = messages.Production;

const order = (id: number, name: string, createdAt: string): Order =>
  ({ id, user_id: id, total_price: 100 + id, status: "pending", created_at: createdAt, user: { id, name, email: `${name}@x.com` } }) as Order;

// Both placed on Wednesday 2026-07-01; a third on 07-15.
const orders = [order(1, "Ana", "2026-07-01T10:00:00"), order(2, "Bruno", "2026-07-01T14:30:00"), order(3, "Caio", "2026-07-15T09:00:00")];

describe("DateRangeFilter", () => {
  const setup = (value: DateRange = EMPTY_RANGE) => {
    const onChange = vi.fn();
    renderWithProviders(<DateRangeFilter value={value} onChange={onChange} />);
    return onChange;
  };

  it("sends the typed bounds, swapping them when out of order", async () => {
    const onChange = setup({ from: "2026-07-20", to: null });

    const to = screen.getByLabelText(P.period_to);
    await userEvent.type(to, "2026-07-10");
    expect(onChange).toHaveBeenLastCalledWith({ from: "2026-07-10", to: "2026-07-20" });
  });

  it("applies a preset and marks it as active", async () => {
    const onChange = setup(presetRange("this_month"));

    expect(screen.getByRole("button", { name: P.preset_this_month })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: P.preset_last_7_days }));
    expect(onChange).toHaveBeenCalledWith(presetRange("last_7_days"));
  });

  it("clears the period, and offers clearing only when one is set", async () => {
    const onChange = setup({ from: "2026-07-01", to: null });
    await userEvent.click(screen.getByRole("button", { name: P.period_clear }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_RANGE);
  });

  it("has no clear button without a period", () => {
    setup();
    expect(screen.queryByRole("button", { name: P.period_clear })).not.toBeInTheDocument();
  });
});

describe("ProductionCalendar", () => {
  const baseProps = (range: DateRange = EMPTY_RANGE) => ({
    year: 2026,
    month: 6,
    grid: buildMonthGrid(2026, 6),
    ordersByDay: groupOrdersByDay(orders),
    range,
    selectedOrderId: null,
    selectedDay: null,
    ordersCount: orders.length,
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onSelectDay: vi.fn(),
    onSelectOrder: vi.fn(),
  });

  it("shows each order on the day it was placed, with the month total", () => {
    renderWithProviders(<ProductionCalendar {...baseProps()} />);

    expect(screen.getByTitle("#1 · Ana")).toBeInTheDocument();
    expect(screen.getByTitle("#3 · Caio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 — 2 pedidos" })).toBeInTheDocument();
    expect(screen.getByText("3 pedidos realizados neste mês")).toBeInTheDocument();
  });

  it("opens an order from its tile without selecting the day", async () => {
    const props = baseProps();
    renderWithProviders(<ProductionCalendar {...props} />);

    await userEvent.click(screen.getByTitle("#1 · Ana"));
    expect(props.onSelectOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(props.onSelectDay).not.toHaveBeenCalled();
  });

  it("selects a day from its number button", async () => {
    const props = baseProps();
    renderWithProviders(<ProductionCalendar {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "15 — 1 pedido" }));
    expect(props.onSelectDay).toHaveBeenCalledWith(15);
  });

  it("navigates between months", async () => {
    const props = baseProps();
    renderWithProviders(<ProductionCalendar {...props} />);

    await userEvent.click(screen.getByRole("button", { name: P.next_month }));
    await userEvent.click(screen.getByRole("button", { name: P.prev_month }));
    expect(props.onNextMonth).toHaveBeenCalledOnce();
    expect(props.onPrevMonth).toHaveBeenCalledOnce();
  });

  it("dims the days outside the period and has no draggable tiles", () => {
    renderWithProviders(<ProductionCalendar {...baseProps({ from: "2026-07-10", to: "2026-07-20" })} />);

    const cell = (day: number) => screen.getByRole("button", { name: new RegExp(`^${day} — `) }).parentElement!.parentElement!;
    expect(cell(5)).toHaveClass("*:opacity-40");
    expect(cell(15)).not.toHaveClass("*:opacity-40");
    expect(screen.getByTitle("#3 · Caio")).not.toHaveAttribute("draggable", "true");
  });
});

describe("DayOrdersPanel", () => {
  it("lists the orders placed that day and lets the user open one", async () => {
    const onSelectOrder = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <DayOrdersPanel date={new Date(2026, 6, 1)} orders={groupOrdersByDay(orders)[1]} selectedOrderId={null} onSelectOrder={onSelectOrder} onClose={onClose} />
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText("Realizado às 14:30")).toBeInTheDocument();

    await userEvent.click(within(rows[1]).getByRole("button"));
    expect(onSelectOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));

    await userEvent.click(screen.getByRole("button", { name: P.close }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows an empty message for a day without orders", () => {
    renderWithProviders(<DayOrdersPanel date={new Date(2026, 6, 8)} orders={[]} selectedOrderId={null} onSelectOrder={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(P.no_orders_day)).toBeInTheDocument();
  });
});

describe("ProductionList", () => {
  it("renders one row per order with its cycle forecast", () => {
    renderWithProviders(<ProductionList orders={orders} selectedOrderId={null} onSelectOrder={vi.fn()} emptyMessage={P.no_orders_month} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("#1", { exact: false })).toBeInTheDocument();
    // Wednesday 07-01 → reposição 06/07, entrega 13/07.
    expect(within(rows[0]).getByText("13/07")).toBeInTheDocument();
  });

  it("shows the given empty message", () => {
    renderWithProviders(<ProductionList orders={[]} selectedOrderId={null} onSelectOrder={vi.fn()} emptyMessage={P.no_orders_period} />);
    expect(screen.getByText(P.no_orders_period)).toBeInTheDocument();
  });
});
