import { describe, it, expect } from "vitest";
import { dailyWeightKg, totalWeightKg, MIN_RECIPE_WEIGHT_KG } from "./recipe-weight";

describe("dailyWeightKg", () => {
  it("converts each unit to kg", () => {
    expect(dailyWeightKg([{ quantity: 500, unit: "g" }])).toBeCloseTo(0.5);
    expect(dailyWeightKg([{ quantity: 250, unit: "ml" }])).toBeCloseTo(0.25);
    expect(dailyWeightKg([{ quantity: 2, unit: "kg" }])).toBe(2);
    expect(dailyWeightKg([{ quantity: 1.5, unit: "l" }])).toBe(1.5);
    expect(dailyWeightKg([{ quantity: 3, unit: "unit" }])).toBeCloseTo(0.3);
  });

  it("ignores unknown units and sums mixed rows (string quantities included)", () => {
    expect(dailyWeightKg([{ quantity: "100", unit: "g" }, { quantity: 1, unit: "kg" }, { quantity: 9, unit: "box" }])).toBeCloseTo(1.1);
  });

  it("is zero without ingredients", () => {
    expect(dailyWeightKg([])).toBe(0);
  });
});

describe("totalWeightKg", () => {
  it("multiplies by the duration", () => {
    expect(totalWeightKg([{ quantity: 100, unit: "g" }], 15)).toBeCloseTo(MIN_RECIPE_WEIGHT_KG);
  });

  it("falls back to the default duration when empty", () => {
    expect(totalWeightKg([{ quantity: 100, unit: "g" }], 0)).toBeCloseTo(1.5);
  });
});
