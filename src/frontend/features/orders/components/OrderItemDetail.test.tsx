import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-intl";
import type { OrderItem } from "@/hooks/useOrders";
import { OrderItemDetail } from "./OrderItemDetail";

const item = {
  id: 7,
  order_id: 1,
  pet_id: 3,
  recipe_id: 9,
  duration_days: 15,
  position: 2,
  unit_price: 300,
  quantity: 1,
  pet: { id: 3, name: "Brown", type: "dog" },
  recipe: {
    id: 9,
    name: "Carne com batatas",
    description: "Carne moída e batata doce.",
    daily_portions: 2,
    instructions: "Assar por 20 minutos.",
    ingredients: [
      { id: 1, name: "Carne", category: "Proteína", unit: "kg", pivot: { quantity: "400", unit: "g" } },
      { id: 2, name: "Batata doce", category: "Carboidrato", unit: "kg", pivot: { quantity: "100", unit: "g" } },
    ],
  },
} as unknown as OrderItem;

describe("OrderItemDetail", () => {
  it("summarizes the recipe for the item's duration", () => {
    renderWithProviders(<OrderItemDetail item={item} range={{ startDay: 16, endDay: 30 }} href="/pets/3?tab=recipes" />);

    expect(screen.getByRole("link", { name: /Carne com batatas/ })).toHaveAttribute("href", "/pets/3?tab=recipes");
    expect(screen.getByText("Dias 16–30")).toBeInTheDocument();
    expect(screen.getByText("Carne moída e batata doce.")).toBeInTheDocument();
    expect(screen.getByText("7,5 kg")).toBeInTheDocument();
    expect(screen.getByText("R$ 20,00")).toBeInTheDocument();
    expect(screen.getByText("500 g de comida por dia.")).toBeInTheDocument();
  });

  it("lists the ingredient totals for the whole period on demand", async () => {
    renderWithProviders(<OrderItemDetail item={item} />);

    await userEvent.click(screen.getByRole("button", { name: "Ver os 2 ingredientes e o preparo" }));
    expect(screen.getByRole("row", { name: /Carne.*400 g.*6 kg/ })).toBeInTheDocument();
    expect(screen.getByText("Assar por 20 minutos.")).toBeInTheDocument();
  });

  it("can start with the details open", () => {
    renderWithProviders(<OrderItemDetail item={item} defaultExpanded />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
