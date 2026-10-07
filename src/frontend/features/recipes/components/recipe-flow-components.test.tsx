import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Recipe } from "@/hooks/useRecipes";
import { RecipeSavedScreen } from "./RecipeSavedScreen";
import { TemplatePicker } from "./TemplatePicker";

const R = messages.Recipes;

describe("RecipeSavedScreen", () => {
  it("leads to ordering when the recipe is linked", () => {
    renderWithProviders(<RecipeSavedScreen recipeId={9} linked recipesHref="/recipes" />);

    expect(screen.getByText(R.saved_linked)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(R.make_order) })).toHaveAttribute("href", "/orders/new");
    expect(screen.getByRole("link", { name: new RegExp(R.my_recipes) })).toHaveAttribute("href", "/recipes");
  });

  it("leads to linking when the recipe has no pet yet", () => {
    renderWithProviders(<RecipeSavedScreen recipeId={9} linked={false} recipesHref="/admin/customers/4" />);

    expect(screen.getByText(R.saved_unlinked)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(R.link_to_pet) })).toHaveAttribute("href", "/recipes/9/edit");
    expect(screen.getByRole("link", { name: new RegExp(R.my_recipes) })).toHaveAttribute("href", "/admin/customers/4");
  });
});

describe("TemplatePicker", () => {
  const template = { id: 2, name: "Base Frango", duration_days: 15, ingredients: [{}, {}] } as unknown as Recipe;
  const pets = [{ id: 1, name: "Rex" }, { id: 2, name: "Mel" }];

  const setup = (overrides: Partial<Parameters<typeof TemplatePicker>[0]> = {}) => {
    const props = {
      templates: [template],
      pets,
      selectedPetIds: [1],
      onTogglePet: vi.fn(),
      onCustomize: vi.fn(),
      onUse: vi.fn(),
      cloningId: null,
      ...overrides,
    };
    renderWithProviders(<TemplatePicker {...props} />);
    return props;
  };

  it("marks selected pets and toggles them", async () => {
    const props = setup();

    expect(screen.getByRole("button", { name: "Rex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mel" })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(screen.getByRole("button", { name: "Mel" }));
    expect(props.onTogglePet).toHaveBeenCalledWith(2);
  });

  it("customizes or uses a template directly", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("button", { name: R.customize_template }));
    expect(props.onCustomize).toHaveBeenCalledWith(template);

    await userEvent.click(screen.getByRole("button", { name: R.use_template_direct }));
    expect(props.onUse).toHaveBeenCalledWith(template);
  });

  it("disables actions while a template is being cloned and shows errors", () => {
    setup({ cloningId: 2, error: "Falhou" });

    expect(screen.getByRole("button", { name: R.customize_template })).toBeDisabled();
    expect(screen.getByLabelText(R.cloning).closest("button")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });

  it("hides the pet chips when the customer has no pets", () => {
    setup({ pets: [], selectedPetIds: [] });
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
