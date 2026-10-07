import { describe, it, expect } from "vitest";
import { getCompleteness } from "./completeness";

describe("getCompleteness", () => {
  it("is 0% for an empty account", () => {
    const result = getCompleteness({});
    expect(result.percent).toBe(0);
    expect(result.isComplete).toBe(false);
    expect(result.items.map((i) => i.done)).toEqual([false, false, false]);
  });

  it("ignores a phone made only of mask characters", () => {
    expect(getCompleteness({ phone: "() -" }).items[0].done).toBe(false);
  });

  it("needs both street and city for the address", () => {
    expect(getCompleteness({ street: "Rua A" }).items[1].done).toBe(false);
    expect(getCompleteness({ street: "Rua A", city: "SP" }).items[1].done).toBe(true);
  });

  it("counts the pet once the summary reports one", () => {
    expect(getCompleteness({ petsCount: 0 }).items[2].done).toBe(false);
    expect(getCompleteness({ petsCount: 2 }).items[2].done).toBe(true);
  });

  it("reaches 100% when everything is filled", () => {
    const result = getCompleteness({ phone: "(11) 99999-9999", street: "Rua A", city: "SP", petsCount: 1 });
    expect(result).toMatchObject({ percent: 100, doneCount: 3, isComplete: true });
  });

  it("rounds partial progress", () => {
    expect(getCompleteness({ phone: "11999999999" }).percent).toBe(33);
  });
});
