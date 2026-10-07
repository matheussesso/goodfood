import { describe, it, expect } from "vitest";
import { formatCep, hasPhoneNumber, isValidEmail } from "./masks";

describe("formatCep", () => {
  it("masks progressively", () => {
    expect(formatCep("0131")).toBe("0131");
    expect(formatCep("01310")).toBe("01310");
    expect(formatCep("013101")).toBe("01310-1");
    expect(formatCep("01310100")).toBe("01310-100");
  });

  it("drops non-digits and caps at 8 digits", () => {
    expect(formatCep("01.310-100 99")).toBe("01310-100");
    expect(formatCep("abc")).toBe("");
  });
});

describe("isValidEmail", () => {
  it("accepts regular addresses", () => {
    expect(isValidEmail("jane@example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const bad of ["", "jane", "jane@", "@example.com", "jane@example", "ja ne@example.com"]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});

describe("hasPhoneNumber", () => {
  it("requires at least 4 digits after the country code", () => {
    expect(hasPhoneNumber("+55 (11) 99999-9999")).toBe(true);
    expect(hasPhoneNumber("+55 123")).toBe(false);
    expect(hasPhoneNumber("+55 1234")).toBe(true);
  });

  it("rejects a bare country code", () => {
    expect(hasPhoneNumber("+55")).toBe(false);
    expect(hasPhoneNumber("")).toBe(false);
  });
});
