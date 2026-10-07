import { describe, it, expect } from "vitest";
import { sortSupplementLines, sumBreakdown, BREAKDOWN_LABEL_KEYS, ADMIN_BREAKDOWN_ORDER } from "./cost";

const line = (name: string, total_cost: number | string) => ({ name, total_cost, is_supplement: true });

describe("sortSupplementLines", () => {
  it("orders by the canonical admin order and puts unknown lines last", () => {
    const sorted = sortSupplementLines([line("Cobrar", 1), line("Mystery", 2), line("Repasse Logística", 3), line("Agenda", 4)]);
    expect(sorted.map((l) => l.name)).toEqual(["Repasse Logística", "Agenda", "Cobrar", "Mystery"]);
  });

  it("does not mutate the input", () => {
    const input = [line("Cobrar", 1), line("Agenda", 2)];
    sortSupplementLines(input);
    expect(input.map((l) => l.name)).toEqual(["Cobrar", "Agenda"]);
  });
});

describe("sumBreakdown", () => {
  it("adds numeric and string costs", () => {
    expect(sumBreakdown([line("a", 1.5), line("b", "2.25")])).toBeCloseTo(3.75);
  });

  it("returns 0 for no lines", () => {
    expect(sumBreakdown([])).toBe(0);
  });
});

describe("BREAKDOWN_LABEL_KEYS", () => {
  it("has a translation key for every ordered line", () => {
    for (const name of ADMIN_BREAKDOWN_ORDER) {
      expect(BREAKDOWN_LABEL_KEYS[name]).toBeTruthy();
    }
  });
});
