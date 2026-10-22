import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders, messages } from "@/test/render-intl";
import { DurationStepper } from "./DurationStepper";

const O = messages.Orders;

describe("DurationStepper", () => {
  it("steps one day at a time and stops at the minimum", () => {
    const onChange = vi.fn();
    const { unmount } = renderWithProviders(<DurationStepper value={15} min={15} onChange={onChange} label="Frango" />);

    expect(screen.getByRole("button", { name: O.duration_decrease })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: O.duration_increase }));
    expect(onChange).toHaveBeenCalledWith(16);

    unmount();
    renderWithProviders(<DurationStepper value={90} onChange={onChange} label="Frango" />);
    expect(screen.getByRole("button", { name: O.duration_increase })).toBeDisabled();
  });

  it("offers 7/15/30 shortcuts, disabling the ones below the minimum", () => {
    const onChange = vi.fn();
    renderWithProviders(<DurationStepper value={15} min={10} onChange={onChange} label="Frango" />);

    expect(screen.getByRole("button", { name: "7 dias" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "15 dias" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "30 dias" }));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it("applies a typed value on blur, clamped to the range", () => {
    const onChange = vi.fn();
    renderWithProviders(<DurationStepper value={15} onChange={onChange} label="Frango" />);
    const input = screen.getByRole("spinbutton", { name: "Duração de Frango em dias" });

    fireEvent.change(input, { target: { value: "200" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(90);
  });
});
