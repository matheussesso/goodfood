import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("exposes the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 500));
    expect(result.current).toBe("a");
  });

  it("only updates after the quiet period and restarts the timer on each change", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(400));
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("c");
  });
});
