import { describe, it, expect } from "vitest";
import { getNavLinks, isNavLinkActive } from "./nav-links";

const hrefs = (role?: string) => getNavLinks(role).map((l) => l.href);

describe("getNavLinks", () => {
  it("gives customers dashboard, pets, recipes and orders", () => {
    expect(hrefs("customer")).toEqual(["/dashboard", "/pets", "/recipes", "/orders"]);
  });

  it("defaults to the customer menu", () => {
    expect(hrefs()).toEqual(hrefs("customer"));
  });

  it("gives admins the admin area plus production, without the customer dashboard", () => {
    expect(hrefs("admin")).toEqual(["/admin", "/admin/customers", "/admin/catalog", "/admin/orders", "/production"]);
  });

  it("gives producers the generic dashboard plus production", () => {
    expect(hrefs("producer")).toEqual(["/dashboard", "/production"]);
  });

  it("limits roles without a dedicated area to the dashboard", () => {
    for (const role of ["vet", "petshop", "delivery"]) {
      expect(hrefs(role)).toEqual(["/dashboard"]);
    }
  });
});

describe("isNavLinkActive", () => {
  it("matches root dashboards exactly", () => {
    expect(isNavLinkActive("/admin", "/admin")).toBe(true);
    expect(isNavLinkActive("/admin", "/admin/orders")).toBe(false);
    expect(isNavLinkActive("/dashboard", "/dashboard/x")).toBe(false);
  });

  it("matches nested routes for other links", () => {
    expect(isNavLinkActive("/orders", "/orders/12")).toBe(true);
    expect(isNavLinkActive("/orders", "/orders")).toBe(true);
    expect(isNavLinkActive("/orders", "/ordersx")).toBe(false);
  });
});
