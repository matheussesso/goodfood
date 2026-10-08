import type { MetadataRoute } from "next";
import { company } from "@/lib/company";
import { localizePath } from "@/i18n/pathnames";

/** Public, indexable pages (Portuguese is the default locale, so no prefix). */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/login", "/register"].map((route) => ({
    url: `${company.siteUrl}${localizePath(route, "pt")}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
