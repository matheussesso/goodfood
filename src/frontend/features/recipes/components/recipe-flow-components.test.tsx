import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Recipe } from "@/hooks/useRecipes";
import { TemplatePicker } from "./TemplatePicker";

const R = messages.Recipes;

describe("TemplatePicker", () => {
  const template = { id: 2, name: "Base Frango", duration_days: 15, ingredients: [{}, {}] } as unknown as Recipe;

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

  it("says when the catalog has no templates", () => {
    setup({ templates: [] });
    expect(screen.getByText(R.no_templates)).toBeInTheDocument();
  });
});
