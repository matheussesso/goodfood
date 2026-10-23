import { describe, expect, it } from "vitest";
import type { Recipe } from "@/hooks/useRecipes";
import {
  categoryShares,
  categoryTone,
  formatQuantity,
  ingredientFacts,
  recipeDailyKg,
  scaleQuantity,
  weightQuantity,
} from "./recipe-facts";

const ing = (id: number, name: string, category: string | undefined, quantity: string, unit: string) => ({
  id,
  name,
  category,
  unit: "kg",
  pivot: { quantity, unit },
});

const recipe = {
  ingredients: [
    ing(1, "Cenoura", "Vegetal", "100", "g"),
    ing(2, "Frango", "Proteína", "0.3", "kg"),
    ing(3, "Ovo", "Proteína", "1", "unit"),
  ],
} as unknown as Recipe;

describe("ingredientFacts", () => {
  it("lists ingredients heaviest first with their share of the daily weight", () => {
    const facts = ingredientFacts(recipe);
    expect(facts.map((f) => f.name)).toEqual(["Frango", "Cenoura", "Ovo"]);
    expect(facts[0].dailyKg).toBeCloseTo(0.3);
    expect(facts[0].share).toBeCloseTo(0.6);
    expect(facts.reduce((sum, f) => sum + f.share, 0)).toBeCloseTo(1);
  });

  it("handles recipes without ingredients", () => {
    expect(ingredientFacts({ ingredients: [] } as unknown as Recipe)).toEqual([]);
    expect(recipeDailyKg({ ingredients: [] } as unknown as Recipe)).toBe(0);
  });
});

describe("categoryShares", () => {
  it("sums the shares per category, largest first", () => {
    const shares = categoryShares(recipe);
    expect(shares.map((s) => s.category)).toEqual(["Proteína", "Vegetal"]);
    expect(shares[0].share).toBeCloseTo(0.8);
  });

  it("groups ingredients without a category together", () => {
    const shares = categoryShares({ ingredients: [ing(1, "X", undefined, "1", "kg")] } as unknown as Recipe);
    expect(shares).toEqual([{ category: null, share: 1 }]);
  });
});

describe("quantities", () => {
  it("totals daily amounts for a period, moving to kg/l from 1000 g/ml", () => {
    expect(scaleQuantity(100, "g", 15)).toEqual({ value: 1.5, unit: "kg" });
    expect(scaleQuantity(50, "g", 7)).toEqual({ value: 350, unit: "g" });
    expect(scaleQuantity(200, "ml", 5)).toEqual({ value: 1, unit: "l" });
    expect(scaleQuantity(1, "unit", 30)).toEqual({ value: 30, unit: "unit" });
  });

  it("shows light weights in grams", () => {
    expect(weightQuantity(0.5)).toEqual({ value: 500, unit: "g" });
    expect(weightQuantity(7.5)).toEqual({ value: 7.5, unit: "kg" });
  });

  it("formats in pt-BR with a label for counted units", () => {
    expect(formatQuantity({ value: 1.5, unit: "kg" }, "un")).toBe("1,5 kg");
    expect(formatQuantity({ value: 250, unit: "g" }, "un")).toBe("250 g");
    expect(formatQuantity({ value: 30, unit: "unit" }, "un")).toBe("30 un");
  });
});

describe("categoryTone", () => {
  it("maps catalog categories regardless of accents and case", () => {
    expect(categoryTone("Proteína")).toBe("bg-rose-500");
    expect(categoryTone("VEGETAL")).toBe("bg-emerald-500");
    expect(categoryTone(null)).toBe("bg-slate-400");
  });
});
