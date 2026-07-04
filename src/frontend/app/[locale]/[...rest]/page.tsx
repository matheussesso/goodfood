import { notFound } from "next/navigation";

/**
 * Catch-all for URLs that match a locale but no real route. Delegates to
 * the localized app/[locale]/not-found.tsx page.
 */
export default function CatchAllPage() {
  notFound();
}
