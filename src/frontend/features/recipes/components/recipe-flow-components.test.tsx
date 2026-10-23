import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Recipe } from "@/hooks/useRecipes";
import { TemplatePicker } from "./TemplatePicker";

const R = messages.Recipes;

describe("TemplatePicker", () => {
  const template = {
    id: 2,
    name: "Base Frango",
    description: "Frango com legumes.",
    pet_type: "dog",
    duration_days: 15,
    daily_portions: 2,
    base_cost: 150,
    ingredients: [
      { id: 1, name: "Frango", category: "Proteína", unit: "kg", pivot: { quantity: "300", unit: "g" } },
      { id: 2, name: "Cenoura", category: "Vegetal", unit: "kg", pivot: { quantity: "200", unit: "g" } },
    ],
  } as unknown as Recipe;

  const setup = (overrides: Partial<Parameters<typeof TemplatePicker>[0]> = {}) => {
    const props = {
      templates: [template],
      onCustomize: vi.fn(),
      onUse: vi.fn(),
      busyId: null,
      ...overrides,
    };
    renderWithProviders(<TemplatePicker {...props} />);
    return props;
  };

  it("customizes or uses a template as it is", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("button", { name: R.customize_template }));
    expect(props.onCustomize).toHaveBeenCalledWith(template);

    await userEvent.click(screen.getByRole("button", { name: R.use_template_direct }));
    expect(props.onUse).toHaveBeenCalledWith(template);
  });

  it("locks the actions while a template is being used and shows errors", () => {
    setup({ busyId: 2, error: "Falhou" });

    expect(screen.getByRole("button", { name: R.customize_template })).toBeDisabled();
    expect(screen.getByLabelText(R.cloning).closest("button")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });

  it("shows what the template is made of and its price before choosing", async () => {
    setup();

    expect(screen.getByText("Frango com legumes.")).toBeInTheDocument();
    expect(screen.getByText(messages.Catalog.dog)).toBeInTheDocument();
    expect(screen.getByText("500 g")).toBeInTheDocument();
    expect(screen.getByText("R$ 150,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 10,00 por dia · plano de 15 dias")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Proteína 60%, Vegetal 40%/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ver os 2 ingredientes e o preparo" }));
    expect(screen.getByRole("row", { name: /Frango.*300 g.*4,5 kg/ })).toBeInTheDocument();
  });

  it("says when the catalog has no templates", () => {
    setup({ templates: [] });
    expect(screen.getByText(R.no_templates)).toBeInTheDocument();
  });
});
