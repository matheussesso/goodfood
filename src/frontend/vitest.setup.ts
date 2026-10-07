import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest runs without globals, so Testing Library's automatic cleanup is not
// registered; unmount between tests to keep the DOM isolated.
afterEach(() => {
  cleanup();
});
