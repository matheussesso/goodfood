import { describe, it, expect } from "vitest";
import { formatBrazilianPhone, getWhatsappUrl } from "./company";

describe("formatBrazilianPhone", () => {
  it("formats mobile numbers with the country code", () => {
    expect(formatBrazilianPhone("5561981425385")).toBe("(61) 98142-5385");
  });

  it("formats landlines and numbers without country code", () => {
    expect(formatBrazilianPhone("6133334444")).toBe("(61) 3333-4444");
  });

  it("returns unexpected input unchanged", () => {
    expect(formatBrazilianPhone("123")).toBe("123");
  });
});

describe("getWhatsappUrl", () => {
  it("links to the company number", () => {
    expect(getWhatsappUrl()).toBe("https://wa.me/5561981425385");
  });

  it("encodes the pre-filled message", () => {
    expect(getWhatsappUrl("Olá! Tudo bem?")).toBe("https://wa.me/5561981425385?text=Ol%C3%A1!%20Tudo%20bem%3F");
  });
});
