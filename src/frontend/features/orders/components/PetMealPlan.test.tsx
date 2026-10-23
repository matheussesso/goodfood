import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { Pet } from "@/hooks/usePets";
import type { Recipe } from "@/hooks/useRecipes";
import type { MealPlanStep } from "../meal-plan";
import { PetMealPlan } from "./PetMealPlan";

const O = messages.Orders;
const pet = { id: 1, name: "Rex", type: "dog" } as Pet;
const recipe = (id: number, name: string) =>
  ({ id, name, daily_portions: 2, ingredients: [{ id: 1, pivot: { quantity: "0.5", unit: "kg" } }] }) as unknown as Recipe;
const chicken = recipe(10, "Frango");
const beef = recipe(11, "Carne");

const steps: MealPlanStep[] = [
  { key: "a", petId: 1, recipeId: 10, durationDays: 15 },
  { key: "b", petId: 1, recipeId: 11, durationDays: 30 },
];

function renderPlan(overrides: Partial<Parameters<typeof PetMealPlan>[0]> = {}) {
  const handlers = { onAdd: vi.fn(), onRemove: vi.fn(), onMove: vi.fn(), onDurationChange: vi.fn() };
  renderWithProviders(
    <PetMealPlan
      pet={pet}
      recipes={[chicken, beef]}
      steps={steps}
      recipesById={{ 10: chicken, 11: beef }}
      costs={{ a: 100, b: 200 }}
      {...handlers}
      {...overrides}
    />
  );
  return handlers;
}

describe("PetMealPlan", () => {
  it("lists the steps on consecutive day ranges with their prices", () => {
    renderPlan();
    expect(screen.getByText("Dias 1–15")).toBeInTheDocument();
    expect(screen.getByText("Dias 16–45")).toBeInTheDocument();
    expect(screen.getByText("45 dias")).toBeInTheDocument();
    expect(screen.getByText("R$ 200,00")).toBeInTheDocument();
  });

  it("shows the daily portions of each step and of the recipes to add", () => {
    renderPlan();
    // Two steps plus two "add" buttons.
    expect(screen.getAllByText("2 porções/dia")).toHaveLength(4);
    expect(screen.getByRole("button", { name: /Carne.*2 porções\/dia/ })).toBeInTheDocument();
  });

  it("adds, moves and removes recipes", () => {
    const handlers = renderPlan();

    fireEvent.click(screen.getByRole("button", { name: /^Carne/ }));
    expect(handlers.onAdd).toHaveBeenCalledWith(beef);

    expect(screen.getByRole("button", { name: "Mover Frango para antes" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Mover Frango para depois" }));
    expect(handlers.onMove).toHaveBeenCalledWith("a", 1);

    fireEvent.click(screen.getByRole("button", { name: "Remover Carne do plano" }));
    expect(handlers.onRemove).toHaveBeenCalledWith("b");
  });

  it("asks for the first recipe when the plan is empty", () => {
    renderPlan({ steps: [] });
    expect(screen.getByText(O.plan_add_first)).toBeInTheDocument();
  });

  it("offers to create a recipe when the pet has none", () => {
    renderPlan({ steps: [], recipes: [] });
    expect(screen.getByText("Rex não tem receitas vinculadas.")).toBeInTheDocument();
  });
});
