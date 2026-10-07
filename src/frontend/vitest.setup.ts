import "@testing-library/jest-dom/vitest";
import { createElement, type AnchorHTMLAttributes } from "react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest runs without globals, so Testing Library's automatic cleanup is not
// registered; unmount between tests to keep the DOM isolated.
afterEach(() => {
  cleanup();
});

// next-intl's navigation helpers import `next/navigation`, which is not
// resolvable outside Next, and the wrappers translate URLs per locale. Components only need a plain link and inert router.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    createElement("a", { href, ...props }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
}));
