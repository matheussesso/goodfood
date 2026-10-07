import { describe, it, expect } from "vitest";
import {
  ORDER_PIPELINE,
  ORDER_STATUSES,
  ORDER_STATUS_STYLE,
  getOrderProgressStep,
  getOrderStatusStyle,
  getSubscriptionStatusStyle,
} from "./order-status";

describe("order status config", () => {
  it("starts the pipeline at pending_payment and excludes cancelled", () => {
    expect(ORDER_PIPELINE[0]).toBe("pending_payment");
    expect(ORDER_PIPELINE).not.toContain("cancelled");
    expect(ORDER_PIPELINE.at(-1)).toBe("delivered");
  });

  it("has a style for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_STYLE[status].badge).toBeTruthy();
      expect(ORDER_STATUS_STYLE[status].dot).toBeTruthy();
      expect(ORDER_STATUS_STYLE[status].bar).toBeTruthy();
    }
  });

  it("returns the pipeline index, or -1 for cancelled and unknown statuses", () => {
    expect(getOrderProgressStep("pending_payment")).toBe(0);
    expect(getOrderProgressStep("delivered")).toBe(5);
    expect(getOrderProgressStep("cancelled")).toBe(-1);
    expect(getOrderProgressStep("bogus")).toBe(-1);
  });

  it("falls back to the pending style for unknown order statuses", () => {
    expect(getOrderStatusStyle("bogus")).toBe(ORDER_STATUS_STYLE.pending);
  });

  it("resolves subscription styles with an active fallback", () => {
    expect(getSubscriptionStatusStyle("paused").dot).toBe("bg-amber-400");
    expect(getSubscriptionStatusStyle("bogus").dot).toBe("bg-emerald-500");
  });
});
