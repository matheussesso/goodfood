import { describe, it, expect } from "vitest";
import { Order } from "@/hooks/useOrders";
import {
  areAllPhasesSelected,
  buildMonthGrid,
  buildPhaseEntries,
  computeCycleDates,
  countByPhase,
  entriesInMonth,
  getPhaseDate,
  getRescheduleAnchor,
  groupEntriesByDay,
  isHighlightDay,
  isPhaseDraggable,
  togglePhase,
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

describe("togglePhase", () => {
  it("adds a phase keeping the cycle order", () => {
    expect(togglePhase(["entrega"], "reposicao")).toEqual(["reposicao", "entrega"]);
  });

  it("removes a selected phase", () => {
    expect(togglePhase(["reposicao", "producao"], "reposicao")).toEqual(["producao"]);
  });

  it("never leaves the selection empty", () => {
    expect(togglePhase(["producao"], "producao")).toEqual(["producao"]);
  });

  it("detects when all phases are selected", () => {
    expect(areAllPhasesSelected(["order_placed", "reposicao", "producao", "entrega"])).toBe(true);
    expect(areAllPhasesSelected(["reposicao"])).toBe(false);
  });
});

describe("phase entries", () => {
  // Wednesday 2026-07-01 → reposição 07-06, produção 07-07, entrega 07-13.
  const wed = orderStub({ id: 1, created_at: "2026-07-01T09:00:00" });
  // Friday 2026-07-03 → same cycle dates as the order above.
  const fri = orderStub({ id: 2, created_at: "2026-07-03T09:00:00" });

  it("creates one entry per order and selected phase", () => {
    const entries = buildPhaseEntries([wed, fri], ["reposicao", "entrega"]);
    expect(entries).toHaveLength(4);
    expect(entries.map((e) => `${e.order.id}:${e.phase}:${toDateStr(e.date)}`)).toEqual([
      "1:reposicao:2026-07-06",
      "1:entrega:2026-07-13",
      "2:reposicao:2026-07-06",
      "2:entrega:2026-07-13",
    ]);
  });

  it("keeps only entries of the requested month", () => {
    const late = orderStub({ id: 3, created_at: "2026-07-29T09:00:00" }); // reposição 2026-08-03
    const entries = buildPhaseEntries([wed, late], ["reposicao"]);
    expect(entriesInMonth(entries, 2026, 6).map((e) => e.order.id)).toEqual([1]);
    expect(entriesInMonth(entries, 2026, 7).map((e) => e.order.id)).toEqual([3]);
  });

  it("groups by day sorting by phase order and then by order id", () => {
    const entries = buildPhaseEntries([fri, wed], ["producao", "reposicao"]);
    const byDay = groupEntriesByDay(entriesInMonth(entries, 2026, 6));

    expect(Object.keys(byDay).map(Number).sort((a, b) => a - b)).toEqual([6, 7]);
    expect(byDay[6].map((e) => `${e.phase}:${e.order.id}`)).toEqual(["reposicao:1", "reposicao:2"]);
    expect(byDay[7].map((e) => `${e.phase}:${e.order.id}`)).toEqual(["producao:1", "producao:2"]);
  });

  it("counts entries per phase, including empty ones", () => {
    const entries = buildPhaseEntries([wed, fri], ["reposicao", "producao"]);
    expect(countByPhase(entries)).toEqual({ order_placed: 0, reposicao: 2, producao: 2, entrega: 0 });
  });
});

describe("getRescheduleAnchor", () => {
  const dropped = new Date(2026, 6, 14); // Tuesday 2026-07-14

  it("uses the dropped day for reposição", () => {
    expect(toDateStr(getRescheduleAnchor("reposicao", dropped)!)).toBe("2026-07-14");
  });

  it("moves the anchor 1 day back for produção and 7 for entrega", () => {
    expect(toDateStr(getRescheduleAnchor("producao", dropped)!)).toBe("2026-07-13");
    expect(toDateStr(getRescheduleAnchor("entrega", dropped)!)).toBe("2026-07-07");
  });

  it("does not reschedule the placement date", () => {
    expect(getRescheduleAnchor("order_placed", dropped)).toBeNull();
    expect(isPhaseDraggable("order_placed")).toBe(false);
    expect(isPhaseDraggable("entrega")).toBe(true);
  });

  it("does not mutate the dropped date", () => {
    getRescheduleAnchor("entrega", dropped);
    expect(toDateStr(dropped)).toBe("2026-07-14");
  });
});
