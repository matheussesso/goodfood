import { describe, it, expect } from "vitest";
import { parseApiDate } from "./dates";

describe("parseApiDate", () => {
  it("reads date-only strings as local midnight", () => {
    const date = parseApiDate("2026-03-05");
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 2, 5, 0]);
  });

  it("reads datetimes as the instant they describe", () => {
    expect(parseApiDate("2026-03-05T12:00:00Z").toISOString()).toBe("2026-03-05T12:00:00.000Z");
  });
});
