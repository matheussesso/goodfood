import { defineRouting } from "next-intl/routing";
import { buildPathnames } from "./pathnames";

const locales = ["pt", "en", "es"] as const;

/** Locale and URL configuration shared by the middleware, the request config and the layout. */
export const routing = defineRouting({
  locales,
  defaultLocale: "pt",
  localePrefix: "as-needed",
  localeDetection: false,
  pathnames: buildPathnames(locales),
});
