import { describe, it, expect } from "vitest";
import { Order } from "@/hooks/useOrders";
import {
  buildMonthGrid,
  computeCycleDates,
  getPhaseDate,
  isHighlightDay,
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

describe("isHighlightDay", () => {
  it("highlights Mondays for reposição and entrega", () => {
    expect(isHighlightDay(1, "reposicao")).toBe(true);
    expect(isHighlightDay(1, "entrega")).toBe(true);
    expect(isHighlightDay(2, "reposicao")).toBe(false);
  });

  it("highlights Tuesday through Saturday for produção", () => {
    expect(isHighlightDay(2, "producao")).toBe(true);
    expect(isHighlightDay(6, "producao")).toBe(true);
    expect(isHighlightDay(0, "producao")).toBe(false);
    expect(isHighlightDay(1, "producao")).toBe(false);
  });

  it("never highlights for order_placed", () => {
    expect(isHighlightDay(1, "order_placed")).toBe(false);
  });
});
