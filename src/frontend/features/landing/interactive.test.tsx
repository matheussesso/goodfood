import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import messages from "@/messages/pt.json";
import { DEFAULT_LABEL_SELECTION, LABEL_INGREDIENTS } from "./content";
import { FeatureTabs } from "./components/FeatureTabs";
import { RecipeLabel, type RecipeLabelCopy } from "./components/RecipeLabel";

const label = messages.Landing.hero.label;

const copy: RecipeLabelCopy = {
  title: label.title,
  meta: label.meta,
  hint: label.hint,
  total: label.total,
  note: label.note,
  empty: label.empty,
  logoAlt: "Good Food Pet",
  ingredients: label.ingredients,
};

const gramsOf = (ids: readonly string[]) => LABEL_INGREDIENTS.filter((i) => ids.includes(i.id)).reduce((sum, i) => sum + i.grams, 0);

describe("RecipeLabel", () => {
  it("starts with the default ingredients and their total", () => {
    render(<RecipeLabel copy={copy} />);

    const pressed = screen.getAllByRole("button", { pressed: true });
    expect(pressed).toHaveLength(DEFAULT_LABEL_SELECTION.length);
    expect(screen.getByText(String(gramsOf(DEFAULT_LABEL_SELECTION)), { exact: false, selector: "p" })).toBeInTheDocument();
  });

  it("adds and removes ingredients and keeps the total in sync", async () => {
    render(<RecipeLabel copy={copy} />);

    await userEvent.click(screen.getByRole("button", { name: label.ingredients.carrot }));
    expect(screen.getByRole("button", { name: label.ingredients.carrot })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(`${gramsOf([...DEFAULT_LABEL_SELECTION, "carrot"])}`, { exact: false, selector: "p" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: label.ingredients.chicken }));
    expect(screen.getByRole("button", { name: label.ingredients.chicken })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows an empty message when nothing is selected", async () => {
    render(<RecipeLabel copy={copy} />);
    for (const button of screen.getAllByRole("button", { pressed: true })) await userEvent.click(button);

    expect(screen.getByText(label.empty)).toBeInTheDocument();
  });
});

describe("FeatureTabs", () => {
  const item = (id: string, panel: ReactNode) => ({ id, icon: null, title: `Title ${id}`, description: `Description ${id}`, panel });
  const items = [item("a", <p>Panel A</p>), item("b", <p>Panel B</p>), item("c", <p>Panel C</p>)];

  it("shows the selected feature's description and panel only", async () => {
    render(<FeatureTabs items={items} label="Features" />);

    expect(screen.getByRole("tab", { name: /Title a/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Description a")).toBeInTheDocument();
    expect(screen.getByText("Panel A")).toBeVisible();
    expect(screen.queryByText("Description b")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /Title b/ }));
    expect(screen.getByText("Panel B")).toBeVisible();
    expect(screen.getByText("Description b")).toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys, wrapping around", async () => {
    render(<FeatureTabs items={items} label="Features" />);
    screen.getByRole("tab", { name: /Title a/ }).focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: /Title b/ })).toHaveFocus();

    await userEvent.keyboard("{End}{ArrowDown}");
    expect(screen.getByRole("tab", { name: /Title a/ })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("tab", { name: /Title c/ })).toHaveAttribute("aria-selected", "true");
  });
});
