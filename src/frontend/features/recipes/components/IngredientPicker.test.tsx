import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/pt.json";
import type { Ingredient } from "@/hooks/useIngredients";
import type { DraftIngredient } from "@/features/recipes/useRecipeCostSimulation";
import { IngredientPicker } from "./IngredientPicker";

const catalog = [
  { id: 1, name: "Frango", category: "Proteína", unit: "kg" },
  { id: 2, name: "Arroz", category: "Carboidrato", unit: "g" },
  { id: 3, name: "Abóbora", category: "Vegetal", unit: "g" },
] as Ingredient[];

function Host({ initial = [], onChange, error }: { initial?: DraftIngredient[]; onChange?: (v: DraftIngredient[]) => void; error?: string }) {
  const [value, setValue] = useState<DraftIngredient[]>(initial);
  return (
    <NextIntlClientProvider locale="pt" messages={messages}>
      <IngredientPicker
        catalog={catalog}
        value={value}
        error={error}
        baseCostLines={[{ name: "Frango", total_cost: 12.5 }]}
        onChange={(next) => {
          onChange?.(next);
          setValue(next);
        }}
      />
    </NextIntlClientProvider>
  );
}

describe("IngredientPicker", () => {
  it("lists the catalog alphabetically", () => {
    render(<Host />);
    const names = screen.getAllByRole("button", { pressed: false }).map((b) => b.textContent ?? "");
    expect(names.findIndex((n) => n.includes("Abóbora"))).toBeLessThan(names.findIndex((n) => n.includes("Arroz")));
  });

  it("adds an ingredient with its catalog unit and removes it on second click", async () => {
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /Arroz/ }));
    expect(onChange).toHaveBeenLastCalledWith([{ id: 2, quantity: "", unit: "g" }]);
    expect(screen.getByRole("button", { name: /Arroz/ })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: /Arroz/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("filters by search term and category", async () => {
    render(<Host />);

    await userEvent.type(screen.getByPlaceholderText("Pesquisar ingrediente..."), "arr");
    expect(screen.queryByRole("button", { name: /Frango/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Arroz/ })).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText("Pesquisar ingrediente..."));
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), "Vegetal");
    expect(screen.queryByRole("button", { name: /Arroz/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abóbora/ })).toBeInTheDocument();
  });

  it("sanitizes the typed quantity (comma becomes dot, letters dropped)", async () => {
    const onChange = vi.fn();
    render(<Host initial={[{ id: 1, quantity: "", unit: "kg" }]} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/Frango Qtd\/dia/), "0,5x");

    expect(onChange).toHaveBeenLastCalledWith([{ id: 1, quantity: "0.5", unit: "kg" }]);
  });

  it("shows the live base cost of a selected row", () => {
    render(<Host initial={[{ id: 1, quantity: "1", unit: "kg" }]} />);
    expect(screen.getByText("R$ 12,50")).toBeInTheDocument();
  });

  it("removes a selected row and shows the validation error", async () => {
    const onChange = vi.fn();
    render(<Host initial={[{ id: 1, quantity: "1", unit: "kg" }]} onChange={onChange} error="Adicione pelo menos 1 ingrediente." />);

    expect(screen.getByText("Adicione pelo menos 1 ingrediente.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
