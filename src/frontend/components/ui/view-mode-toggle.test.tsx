import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewModeToggle } from "./view-mode-toggle";

const labels = { grid: "Grade", list: "Lista" };

describe("ViewModeToggle", () => {
  it("reports the clicked mode", async () => {
    const onChange = vi.fn();
    render(<ViewModeToggle viewMode="card" onViewModeChange={onChange} labels={labels} />);

    await userEvent.click(screen.getAllByRole("button")[1]);
    expect(onChange).toHaveBeenCalledWith("list");

    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onChange).toHaveBeenCalledWith("card");
  });

  it("highlights the active mode", () => {
    render(<ViewModeToggle viewMode="list" onViewModeChange={() => {}} labels={labels} />);
    const [card, list] = screen.getAllByRole("button");
    expect(list).toHaveClass("bg-muted");
    expect(card).not.toHaveClass("bg-muted");
  });

  it("shows text labels only in the mobile variant", () => {
    const { rerender } = render(<ViewModeToggle viewMode="card" onViewModeChange={() => {}} labels={labels} />);
    expect(screen.queryByText("Grade")).not.toBeInTheDocument();

    rerender(<ViewModeToggle viewMode="card" onViewModeChange={() => {}} labels={labels} mobile />);
    expect(screen.getByText("Grade")).toBeInTheDocument();
    expect(screen.getByText("Lista")).toBeInTheDocument();
  });
});
