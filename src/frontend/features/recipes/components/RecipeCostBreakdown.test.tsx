import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/pt.json";
import type { Ingredient } from "@/hooks/useIngredients";
import { RecipeCostBreakdown } from "./RecipeCostBreakdown";

const catalog = [{ id: 1, name: "Frango", unit: "kg" }] as Ingredient[];

const breakdown = [
  { name: "Frango", total_cost: 100 },
  { name: "Cobrar", total_cost: 300, is_supplement: true },
  { name: "Repasse Logística", total_cost: 50, is_supplement: true },
  { name: "Resultado (Lucro Mínimo)", total_cost: 20, is_supplement: true },
];

const renderPanel = (overrides: Partial<Parameters<typeof RecipeCostBreakdown>[0]> = {}) =>
  render(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <RecipeCostBreakdown
        estimatedCost={300}
        costPerKg={25}
        costBreakdown={breakdown}
        isCalculating={false}
        ingredients={[{ id: 1, quantity: "0.4", unit: "kg" }]}
        catalog={catalog}
        durationDays={15}
        dailyPortions={2}
        {...overrides}
      />
    </NextIntlClientProvider>
  );

describe("RecipeCostBreakdown", () => {
  it("shows the headline estimate, cost per kg and base cost", () => {
    renderPanel();
    expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 25,00/kg")).toBeInTheDocument();
    expect(screen.getByText(/Custo Base: R\$ 100,00/)).toBeInTheDocument();
  });

  it("expands the cost detail with translated, ordered supplement lines", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /Ver detalhamento dos custos/ }));

    const labels = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    const logistics = labels.findIndex((l) => l.includes("Repasse Logística"));
    const charge = labels.findIndex((l) => l.startsWith("Cobrar"));
    expect(logistics).toBeGreaterThan(-1);
    expect(logistics).toBeLessThan(charge);
    expect(screen.getByText(/Resultado/)).toBeInTheDocument();
  });

  it("expands the recipe detail with per-portion quantities", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /Ver detalhamento da receita/ }));

    expect(screen.getByText("Frango")).toBeInTheDocument();
    expect(screen.getByText("0,40 kg")).toBeInTheDocument();
    expect(screen.getByText("0,20 kg")).toBeInTheDocument();
  });

  it("prompts to add ingredients when there is no supplement data", async () => {
    renderPanel({ costBreakdown: [], estimatedCost: 0, costPerKg: 0 });
    await userEvent.click(screen.getByRole("button", { name: /Ver detalhamento dos custos/ }));
    expect(screen.getByText("Adicione ingredientes para simular o custo.")).toBeInTheDocument();
  });
});
