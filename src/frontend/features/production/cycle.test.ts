import { describe, it, expect } from "vitest";
import { Order } from "@/hooks/useOrders";
import {
  EMPTY_RANGE,
  buildMonthGrid,
  computeCycleDates,
  getPhaseDate,
  getPlacedDate,
  groupOrdersByDay,
  isDateInRange,
  isRangeActive,
  matchingPreset,
  normalizeRange,
  ordersInMonth,
  ordersInRange,
  presetRange,
  rangeStartMonth,
  toDateStr,
} from "./cycle";

/** Builds a minimal Order stub for cycle-date tests. */
function orderStub(overrides: Partial<Order>): Order {
  return {
    id: 1,
    user_id: 1,
    total_price: "100.00",
    status: "pending",
    created_at: "2026-07-01T10:00:00",
    ...overrides,
  } as Order;
}

describe("computeCycleDates", () => {
  it("moves a Sunday order to reposição on the next day (Monday)", () => {
    // 2026-07-05 is a Sunday
    const { reposicao } = computeCycleDates(orderStub({ created_at: "2026-07-05T15:00:00" }));
    expect(toDateStr(reposicao)).toBe("2026-07-06");
    expect(reposicao.getDay()).toBe(1);
  });

  it("moves a Monday order to reposição on the following Monday (+7)", () => {
    // 2026-07-06 is a Monday
    const { reposicao } = computeCycleDates(orderStub({ created_at: "2026-07-06T09:00:00" }));
    expect(toDateStr(reposicao)).toBe("2026-07-13");
  });

  it("moves a mid-week order to the next Monday", () => {
    // 2026-07-01 is a Wednesday → next Monday is 2026-07-06
    const { reposicao } = computeCycleDates(orderStub({ created_at: "2026-07-01T09:00:00" }));
    expect(toDateStr(reposicao)).toBe("2026-07-06");
  });

  it("derives produção (+1 day) and entrega (+7 days) from reposição", () => {
    const { reposicao, producao, entrega } = computeCycleDates(
      orderStub({ created_at: "2026-07-01T09:00:00" })
    );
    expect(producao.getTime() - reposicao.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(toDateStr(entrega)).toBe("2026-07-13");
  });

  it("uses the admin scheduled_reposicao_date override as the anchor", () => {
    const { reposicao, producao, entrega } = computeCycleDates(
      orderStub({ created_at: "2026-07-01T09:00:00", scheduled_reposicao_date: "2026-07-20" })
    );
    expect(toDateStr(reposicao)).toBe("2026-07-20");
    expect(toDateStr(producao)).toBe("2026-07-21");
    expect(toDateStr(entrega)).toBe("2026-07-27");
  });

  it("accepts datetime formats in the override", () => {
    const { reposicao } = computeCycleDates(
      orderStub({ created_at: "2026-07-01T09:00:00", scheduled_reposicao_date: "2026-07-20 00:00:00" })
    );
    expect(toDateStr(reposicao)).toBe("2026-07-20");
  });
});

describe("getPhaseDate", () => {
  it("returns the order placement date (midnight) for order_placed", () => {
    const d = getPhaseDate(orderStub({ created_at: "2026-07-01T18:45:00" }), "order_placed");
    expect(toDateStr(d)).toBe("2026-07-01");
    expect(d.getHours()).toBe(0);
  });

  it("returns the cycle dates for the other phases", () => {
    const order = orderStub({ created_at: "2026-07-01T09:00:00" });
    expect(toDateStr(getPhaseDate(order, "reposicao"))).toBe("2026-07-06");
    expect(toDateStr(getPhaseDate(order, "producao"))).toBe("2026-07-07");
    expect(toDateStr(getPhaseDate(order, "entrega"))).toBe("2026-07-13");
  });
});

describe("buildMonthGrid", () => {
  it("pads to full weeks and aligns the first day to its weekday", () => {
    // July 2026 starts on a Wednesday (weekday 3) and has 31 days.
    const grid = buildMonthGrid(2026, 6);
    expect(grid.length % 7).toBe(0);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]?.getDate()).toBe(1);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });
});

describe("date range", () => {
  // Thursday 2026-10-22.
  const today = new Date(2026, 9, 22, 15, 30);

  it("builds the presets ending today", () => {
    expect(presetRange("last_7_days", today)).toEqual({ from: "2026-10-16", to: "2026-10-22" });
    expect(presetRange("last_30_days", today)).toEqual({ from: "2026-09-23", to: "2026-10-22" });
    expect(presetRange("this_month", today)).toEqual({ from: "2026-10-01", to: "2026-10-22" });
  });

  it("recognizes the preset a range matches", () => {
    expect(matchingPreset({ from: "2026-10-01", to: "2026-10-22" }, today)).toBe("this_month");
    expect(matchingPreset({ from: "2026-10-02", to: "2026-10-22" }, today)).toBeNull();
  });

  it("swaps bounds typed out of order and treats empty strings as unset", () => {
    expect(normalizeRange({ from: "2026-10-20", to: "2026-10-01" })).toEqual({ from: "2026-10-01", to: "2026-10-20" });
    expect(normalizeRange({ from: "", to: "2026-10-01" })).toEqual({ from: null, to: "2026-10-01" });
    expect(isRangeActive(EMPTY_RANGE)).toBe(false);
    expect(isRangeActive({ from: null, to: "2026-10-01" })).toBe(true);
  });

  it("includes both bounds and leaves unset bounds open", () => {
    const range = { from: "2026-10-05", to: "2026-10-10" };
    expect(isDateInRange(new Date(2026, 9, 5), range)).toBe(true);
    expect(isDateInRange(new Date(2026, 9, 10), range)).toBe(true);
    expect(isDateInRange(new Date(2026, 9, 11), range)).toBe(false);
    expect(isDateInRange(new Date(2020, 0, 1), { from: null, to: "2026-10-10" })).toBe(true);
    expect(isDateInRange(new Date(2030, 0, 1), EMPTY_RANGE)).toBe(true);
  });

  it("opens the calendar on the month of the first bound", () => {
    expect(rangeStartMonth({ from: "2026-09-23", to: "2026-10-22" })).toEqual({ year: 2026, month: 8 });
    expect(rangeStartMonth({ from: null, to: "2026-10-22" })).toEqual({ year: 2026, month: 9 });
    expect(rangeStartMonth(EMPTY_RANGE)).toBeNull();
  });
});

describe("placed orders", () => {
  const orders = [
    orderStub({ id: 3, created_at: "2026-10-05T18:00:00" }),
    orderStub({ id: 1, created_at: "2026-09-30T08:00:00" }),
    orderStub({ id: 2, created_at: "2026-10-05T09:00:00" }),
    orderStub({ id: 4, created_at: "2026-10-12T10:00:00" }),
  ];

  it("uses the placement day at midnight", () => {
    const placed = getPlacedDate(orders[0]);
    expect(toDateStr(placed)).toBe("2026-10-05");
    expect(placed.getHours()).toBe(0);
  });

  it("keeps the orders placed in the period, oldest first", () => {
    expect(ordersInRange(orders, { from: "2026-10-01", to: "2026-10-05" }).map((o) => o.id)).toEqual([2, 3]);
    expect(ordersInRange(orders, EMPTY_RANGE).map((o) => o.id)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the orders of a month and groups them by day", () => {
    const october = ordersInMonth(orders, 2026, 9);
    expect(october.map((o) => o.id).sort()).toEqual([2, 3, 4]);
    const byDay = groupOrdersByDay(october);
    expect(byDay[5].map((o) => o.id)).toEqual([2, 3]);
    expect(byDay[12].map((o) => o.id)).toEqual([4]);
  });
});
