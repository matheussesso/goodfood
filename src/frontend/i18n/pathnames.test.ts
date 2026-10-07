import { describe, it, expect } from "vitest";
import { CANONICAL_ROUTES, buildPathnames, delocalizePath, localizePath } from "./pathnames";

describe("localizePath", () => {
  it("translates static segments to Portuguese", () => {
    expect(localizePath("/recipes/new", "pt")).toBe("/receitas/criar");
    expect(localizePath("/dashboard", "pt")).toBe("/inicio");
    expect(localizePath("/orders/subscriptions/new", "pt")).toBe("/pedidos/assinaturas/criar");
    expect(localizePath("/admin/customers", "pt")).toBe("/admin/clientes");
  });

  it("keeps dynamic values and translates the segments around them", () => {
    expect(localizePath("/recipes/12/edit", "pt")).toBe("/receitas/12/editar");
    expect(localizePath("/admin/customers/4/pets/9", "pt")).toBe("/admin/clientes/4/pets/9");
    expect(localizePath("/orders/subscriptions/7/edit", "pt")).toBe("/pedidos/assinaturas/7/editar");
  });

  it("prefers static routes over dynamic ones", () => {
    expect(localizePath("/orders/new", "pt")).toBe("/pedidos/criar");
    expect(localizePath("/orders/15", "pt")).toBe("/pedidos/15");
  });

  it("preserves query string and hash", () => {
    expect(localizePath("/recipes/new?pet_id=3", "pt")).toBe("/receitas/criar?pet_id=3");
    expect(localizePath("/profile?section=address", "pt")).toBe("/perfil?section=address");
    expect(localizePath("/guide#faq", "pt")).toBe("/guia#faq");
  });

  it("leaves other locales and unknown or external paths untouched", () => {
    expect(localizePath("/recipes/new", "en")).toBe("/recipes/new");
    expect(localizePath("/recipes/new", "es")).toBe("/recipes/new");
    expect(localizePath("/unknown/page", "pt")).toBe("/unknown/page");
    expect(localizePath("https://example.com/orders", "pt")).toBe("https://example.com/orders");
  });

  it("handles the root and trailing slashes", () => {
    expect(localizePath("/", "pt")).toBe("/");
    expect(localizePath("/pets/", "pt")).toBe("/pets");
  });
});

describe("delocalizePath", () => {
  it("restores the canonical route", () => {
    expect(delocalizePath("/receitas/criar", "pt")).toBe("/recipes/new");
    expect(delocalizePath("/pedidos/assinaturas/7/editar", "pt")).toBe("/orders/subscriptions/7/edit");
    expect(delocalizePath("/inicio", "pt")).toBe("/dashboard");
  });

  it("round-trips every canonical route with sample params", () => {
    for (const route of CANONICAL_ROUTES) {
      const concrete = route.replace(/\[[^\]]+\]/g, "42");
      expect(delocalizePath(localizePath(concrete, "pt"), "pt")).toBe(concrete);
    }
  });

  it("returns unknown paths unchanged", () => {
    expect(delocalizePath("/nada/aqui", "pt")).toBe("/nada/aqui");
  });
});

describe("buildPathnames", () => {
  it("maps every canonical route to a URL for each locale", () => {
    const pathnames = buildPathnames(["pt", "en", "es"]);
    expect(Object.keys(pathnames)).toHaveLength(CANONICAL_ROUTES.length);
    expect(pathnames["/recipes/[id]/edit"]).toEqual({
      pt: "/receitas/[id]/editar",
      en: "/recipes/[id]/edit",
      es: "/recipes/[id]/edit",
    });
  });

  it("keeps placeholders identical across locales, as next-intl requires", () => {
    for (const urls of Object.values(buildPathnames(["pt", "en", "es"]))) {
      const placeholders = Object.values(urls).map((url) => url.match(/\[[^\]]+\]/g)?.join(",") ?? "");
      expect(new Set(placeholders).size).toBe(1);
    }
  });
});
