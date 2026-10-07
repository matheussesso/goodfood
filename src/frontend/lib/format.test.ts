import { describe, it, expect } from "vitest";
import { formatBRL } from "./format";

/** Normalizes the non-breaking spaces Intl may emit so assertions stay locale-data agnostic. */
function normalize(value: string): string {
  return value.replace(/ /g, " ");
}

describe("formatBRL", () => {
  it("formats with thousands dot and decimal comma, without prefix by default", () => {
    expect(normalize(formatBRL(1000))).toBe("1.000,00");
    expect(normalize(formatBRL(1234567.891))).toBe("1.234.567,89");
  });

  it("always shows two decimal places", () => {
    expect(formatBRL(5)).toBe("5,00");
    expect(formatBRL(5.5)).toBe("5,50");
    expect(formatBRL(0)).toBe("0,00");
  });

  it("rounds to two decimals", () => {
    expect(formatBRL(1.006)).toBe("1,01");
  });

  it("accepts numeric strings (e.g. decimals serialized by the API)", () => {
    expect(formatBRL("12.5")).toBe("12,50");
  });

  it("adds the R$ prefix when requested", () => {
    expect(normalize(formatBRL(1000, true))).toBe("R$ 1.000,00");
    expect(formatBRL(7, true)).toBe("R$ 7,00");
  });

  it("formats negative values", () => {
    expect(formatBRL(-3.2)).toBe("-3,20");
  });
});
