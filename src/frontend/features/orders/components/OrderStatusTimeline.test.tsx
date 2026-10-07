import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ORDER_PIPELINE } from "@/lib/order-status";
import { OrderStatusTimeline } from "./OrderStatusTimeline";

const labelFor = (status: string) => `label:${status}`;

describe("OrderStatusTimeline", () => {
  it("renders a step for every pipeline status, starting at pending_payment", () => {
    render(<OrderStatusTimeline status="pending_payment" labelFor={labelFor} />);

    for (const status of ORDER_PIPELINE) {
      expect(screen.getByText(`label:${status}`)).toBeInTheDocument();
    }
    expect(screen.getByText("label:pending_payment")).toHaveClass("font-semibold");
  });

  it("marks only the current step as emphasized", () => {
    render(<OrderStatusTimeline status="ready" labelFor={labelFor} />);

    expect(screen.getByText("label:ready")).toHaveClass("font-semibold");
    expect(screen.getByText("label:pending")).not.toHaveClass("font-semibold");
    expect(screen.getByText("label:delivered")).toHaveClass("text-muted-foreground/40");
  });
});
