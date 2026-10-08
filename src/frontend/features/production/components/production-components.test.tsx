import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Order } from "@/hooks/useOrders";
import {
  PHASES,
  buildMonthGrid,
  buildPhaseEntries,
  countByPhase,
  entriesInMonth,
  groupEntriesByDay,
  type Phase,
} from "@/features/production/cycle";
import { DayOrdersPanel } from "./DayOrdersPanel";
import { PhaseFilter } from "./PhaseFilter";
import { ProductionCalendar } from "./ProductionCalendar";
import { ProductionList } from "./ProductionList";

const P = messages.Production;

// Wednesday 2026-07-01 → reposição 07-06, produção 07-07, entrega 07-13.
const order = (id: number, name: string): Order =>
  ({ id, user_id: id, total_price: 100 + id, status: "pending", created_at: "2026-07-01T10:00:00", user: { id, name, email: `${name}@x.com` } }) as Order;

const orders = [order(1, "Ana"), order(2, "Bruno")];

const entriesFor = (phases: Phase[]) => entriesInMonth(buildPhaseEntries(orders, phases), 2026, 6);

describe("PhaseFilter", () => {
  const counts = countByPhase(entriesFor([...PHASES]));

  it("marks the selected phases and shows how many entries each adds", () => {
    renderWithProviders(<PhaseFilter selected={["reposicao", "entrega"]} counts={counts} onToggle={vi.fn()} onSelectAll={vi.fn()} />);

    expect(screen.getByRole("button", { name: new RegExp(P.phase_reposicao) })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: new RegExp(P.phase_producao) })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: new RegExp(P.all_phases) })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a phase and selects all", async () => {
    const onToggle = vi.fn();
    const onSelectAll = vi.fn();
    renderWithProviders(<PhaseFilter selected={["order_placed"]} counts={counts} onToggle={onToggle} onSelectAll={onSelectAll} />);

    await userEvent.click(screen.getByRole("button", { name: new RegExp(P.phase_producao) }));
    expect(onToggle).toHaveBeenCalledWith("producao");

    await userEvent.click(screen.getByRole("button", { name: new RegExp(P.all_phases) }));
    expect(onSelectAll).toHaveBeenCalledOnce();
  });

  it("highlights 'all phases' when everything is selected", () => {
    renderWithProviders(<PhaseFilter selected={[...PHASES]} counts={counts} onToggle={vi.fn()} onSelectAll={vi.fn()} />);
    expect(screen.getByRole("button", { name: new RegExp(P.all_phases) })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ProductionCalendar", () => {
  const baseProps = (phases: Phase[]) => {
    const entries = entriesFor(phases);
    return {
      year: 2026,
      month: 6,
      grid: buildMonthGrid(2026, 6),
      entriesByDay: groupEntriesByDay(entries),
      phases,
      selectedOrderId: null,
      selectedDay: null,
      ordersCount: new Set(entries.map((e) => e.order.id)).size,
      onPrevMonth: vi.fn(),
      onNextMonth: vi.fn(),
      onSelectDay: vi.fn(),
      onSelectOrder: vi.fn(),
      onReschedule: vi.fn(),
    };
  };

  it("shows a tile per order on each selected phase's day", () => {
    renderWithProviders(<ProductionCalendar {...baseProps(["reposicao", "entrega"])} />);

    // 2 orders × 2 phases = 4 tiles (06 and 13 of July).
    expect(screen.getAllByTitle(new RegExp(`${P.phase_reposicao} · #`))).toHaveLength(2);
    expect(screen.getAllByTitle(new RegExp(`${P.phase_entrega} · #`))).toHaveLength(2);
    expect(screen.queryAllByTitle(new RegExp(`${P.phase_producao} · #`))).toHaveLength(0);
  });

  it("opens an order from its tile without selecting the day", async () => {
    const props = baseProps(["reposicao"]);
    renderWithProviders(<ProductionCalendar {...props} />);

    await userEvent.click(screen.getByTitle(`${P.phase_reposicao} · #1 · Ana`));
    expect(props.onSelectOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(props.onSelectDay).not.toHaveBeenCalled();
  });

  it("selects a day from its number button, announcing how many orders it has", async () => {
    const props = baseProps(["reposicao"]);
    renderWithProviders(<ProductionCalendar {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "6 — 2 pedidos" }));
    expect(props.onSelectDay).toHaveBeenCalledWith(6);
    expect(screen.getByRole("button", { name: "7 — sem pedidos" })).toBeInTheDocument();
  });

  it("navigates between months", async () => {
    const props = baseProps(["reposicao"]);
    renderWithProviders(<ProductionCalendar {...props} />);

    await userEvent.click(screen.getByRole("button", { name: P.next_month }));
    await userEvent.click(screen.getByRole("button", { name: P.prev_month }));
    expect(props.onNextMonth).toHaveBeenCalledOnce();
    expect(props.onPrevMonth).toHaveBeenCalledOnce();
  });

  it("reschedules by dropping a tile on another day using the tile's own phase", () => {
    const props = baseProps(["producao"]);
    renderWithProviders(<ProductionCalendar {...props} />);

    const tile = screen.getByTitle(`${P.phase_producao} · #1 · Ana`);
    const dataTransfer = { effectAllowed: "", setData: vi.fn() };
    fireEvent.dragStart(tile, { dataTransfer });

    // Produção dropped on 14/07 means reposição on 13/07.
    const target = screen.getByRole("button", { name: "14 — sem pedidos" }).parentElement!.parentElement!;
    fireEvent.dragEnter(target);
    fireEvent.drop(target);

    expect(props.onReschedule).toHaveBeenCalledWith(1, "2026-07-13");
  });

  it("does not reschedule tiles of the placement phase", () => {
    const props = baseProps(["order_placed"]);
    renderWithProviders(<ProductionCalendar {...props} />);

    const tile = screen.getByTitle(`${P.phase_order_placed} · #1 · Ana`);
    expect(tile).toHaveAttribute("draggable", "false");

    fireEvent.dragStart(tile, { dataTransfer: { effectAllowed: "", setData: vi.fn() } });
    fireEvent.drop(screen.getByRole("button", { name: "14 — sem pedidos" }).parentElement!.parentElement!);
    expect(props.onReschedule).not.toHaveBeenCalled();
  });
});

describe("DayOrdersPanel", () => {
  it("lists every entry of the day with its phase and lets the user open one", async () => {
    const entries = groupEntriesByDay(entriesFor(["reposicao", "entrega"]))[6];
    const onSelectOrder = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<DayOrdersPanel date={new Date(2026, 6, 6)} entries={entries} selectedOrderId={null} onSelectOrder={onSelectOrder} onClose={onClose} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(P.phase_reposicao)).toBeInTheDocument();

    await userEvent.click(within(rows[1]).getByRole("button"));
    expect(onSelectOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));

    await userEvent.click(screen.getByRole("button", { name: P.close }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows an empty message for a day without orders", () => {
    renderWithProviders(<DayOrdersPanel date={new Date(2026, 6, 8)} entries={[]} selectedOrderId={null} onSelectOrder={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(P.no_orders_day)).toBeInTheDocument();
  });
});

describe("ProductionList", () => {
  it("renders one row per order and phase, sorted by date", () => {
    renderWithProviders(<ProductionList entries={entriesFor(["entrega", "reposicao"])} selectedOrderId={null} onSelectOrder={vi.fn()} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(within(rows[0]).getByText(P.phase_reposicao, { selector: "span.rounded-full" })).toBeInTheDocument();
    expect(within(rows[3]).getByText(P.phase_entrega, { selector: "span.rounded-full" })).toBeInTheDocument();
  });

  it("shows the empty state when there are no entries", () => {
    renderWithProviders(<ProductionList entries={[]} selectedOrderId={null} onSelectOrder={vi.fn()} />);
    expect(screen.getByText(P.no_orders_month)).toBeInTheDocument();
  });
});
