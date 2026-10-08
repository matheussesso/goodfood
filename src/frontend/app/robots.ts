import type { MetadataRoute } from "next";
import { company } from "@/lib/company";
import { localizePath } from "@/i18n/pathnames";

/** Authenticated areas are not meant to be indexed. */
const PRIVATE_ROUTES = ["/dashboard", "/guide", "/profile", "/pets", "/recipes", "/orders", "/production", "/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_ROUTES.map((route) => localizePath(route, "pt")) },
    sitemap: `${company.siteUrl}/sitemap.xml`,
    host: company.siteUrl,
  };
}
