import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ORDER_STATUS_STYLE } from "@/lib/order-status";
import { OrderStatusBadge } from "./OrderStatusBadge";

describe("OrderStatusBadge", () => {
  it("renders the label with the order status classes", () => {
    render(<OrderStatusBadge status="delivered" label="Entregue" />);
    const badge = screen.getByText("Entregue");
    for (const cls of ORDER_STATUS_STYLE.delivered.badge.split(" ")) {
      expect(badge).toHaveClass(cls);
    }
  });

  it("falls back gracefully for an unknown status", () => {
    render(<OrderStatusBadge status="bogus" label="???" />);
    expect(screen.getByText("???")).toHaveClass(ORDER_STATUS_STYLE.pending.badge.split(" ")[0]);
  });

  it("applies the roomier padding for the md size", () => {
    render(<OrderStatusBadge status="pending" label="Pendente" size="md" />);
    expect(screen.getByText("Pendente")).toHaveClass("py-1");
  });
});
