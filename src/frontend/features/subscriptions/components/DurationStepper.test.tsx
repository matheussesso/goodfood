import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DurationStepper } from "./DurationStepper";

const t = ((key: string) => key) as never;

describe("DurationStepper", () => {
  it("steps up by 7 days", async () => {
    const onChange = vi.fn();
    render(<DurationStepper value={14} onChange={onChange} t={t} />);

    await userEvent.click(screen.getAllByRole("button")[1]);
    expect(onChange).toHaveBeenCalledWith(21);
  });

  it("steps down by 7 days but never below 14", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<DurationStepper value={28} onChange={onChange} t={t} />);

    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onChange).toHaveBeenCalledWith(21);

    rerender(<DurationStepper value={14} onChange={onChange} t={t} />);
    expect(screen.getAllByRole("button")[0]).toBeDisabled();
  });

  it("shows the week count with singular/plural labels", () => {
    const { rerender } = render(<DurationStepper value={14} onChange={() => {}} t={t} />);
    expect(screen.getByText("2 weeks_count_plural")).toBeInTheDocument();

    rerender(<DurationStepper value={21} onChange={() => {}} t={t} />);
    expect(screen.getByText("3 weeks_count_plural")).toBeInTheDocument();
  });
});
