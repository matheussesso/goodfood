import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Recipe } from "@/hooks/useRecipes";
import { CompositionBar, IngredientTable, RecipeDetailsDisclosure, RecipeInstructions } from "./RecipeFacts";

const R = messages.Recipes;

const recipe = {
  instructions: "Cozinhar a vapor.",
  ingredients: [
    { id: 1, name: "Frango", category: "Proteína", unit: "kg", pivot: { quantity: "300", unit: "g" } },
    { id: 2, name: "Cenoura", category: "Vegetal", unit: "kg", pivot: { quantity: "100", unit: "g" } },
  ],
} as unknown as Recipe;

describe("CompositionBar", () => {
  it("describes the category shares for screen readers and in the legend", () => {
    renderWithProviders(<CompositionBar recipe={recipe} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Composição por categoria: Proteína 75%, Vegetal 25%");
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders nothing without ingredients", () => {
    const { container } = renderWithProviders(<CompositionBar recipe={{ ingredients: [] } as unknown as Recipe} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("IngredientTable", () => {
  it("shows daily amounts and, with a period, the totals", () => {
    renderWithProviders(<IngredientTable recipe={recipe} days={15} />);
    expect(screen.getByRole("columnheader", { name: "Total em 15 dias" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Frango.*300 g.*4,5 kg/ })).toBeInTheDocument();
  });

  it("omits the total column without a period", () => {
    renderWithProviders(<IngredientTable recipe={recipe} />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });
});

describe("RecipeInstructions", () => {
  it("hides when there are no instructions", () => {
    const { container } = renderWithProviders(<RecipeInstructions instructions="  " />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("RecipeDetailsDisclosure", () => {
  it("reveals the ingredients and preparation on demand", async () => {
    renderWithProviders(<RecipeDetailsDisclosure recipe={recipe} days={7} id="details" />);
    const toggle = screen.getByRole("button", { name: "Ver os 2 ingredientes e o preparo" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: R.hide_details })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(R.preparation_instructions)).toBeInTheDocument();
  });
});
