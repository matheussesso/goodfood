/**
 * Locale-specific URL paths.
 *
 * App Router folders (and every `href` in the code) use the canonical English
 * route, e.g. `/recipes/new`. Each locale may rename the static segments, so
 * Portuguese users browse `/receitas/criar`. The middleware rewrites the
 * localized URL back to the canonical folder; `localizePath`/`delocalizePath`
 * convert between the two for links, redirects and active-link checks.
 */

/** Every routable page of the app, with `[param]` placeholders for dynamic segments. */
export const CANONICAL_ROUTES = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/guide",
  "/profile",
  "/pets",
  "/pets/new",
  "/pets/[id]",
  "/pets/[id]/edit",
  "/recipes",
  "/recipes/new",
  "/recipes/[id]",
  "/recipes/[id]/edit",
  "/orders",
  "/orders/new",
  "/orders/[id]",
  "/orders/subscriptions/new",
  "/orders/subscriptions/[id]",
  "/orders/subscriptions/[id]/edit",
  "/production",
  "/admin",
  "/admin/catalog",
  "/admin/customers",
  "/admin/customers/[id]",
  "/admin/customers/[id]/pets/[petId]",
  "/admin/orders",
  "/admin/orders/[id]",
] as const;

/** Translated static segments per locale; locales without an entry keep the canonical English path. */
const SEGMENT_TRANSLATIONS: Record<string, Record<string, string>> = {
  pt: {
    login: "entrar",
    register: "cadastro",
    dashboard: "inicio",
    guide: "guia",
    profile: "perfil",
    recipes: "receitas",
    orders: "pedidos",
    subscriptions: "assinaturas",
    production: "producao",
    catalog: "catalogo",
    customers: "clientes",
    new: "criar",
    edit: "editar",
  },
};

interface RouteMatcher {
  canonical: string;
  localized: string;
  pattern: RegExp;
  dynamicCount: number;
}

const isDynamic = (segment: string) => segment.startsWith("[") && segment.endsWith("]");

/** Replaces the static segments of a canonical route using the locale's dictionary. */
function translateRoute(canonical: string, locale: string): string {
  const dictionary = SEGMENT_TRANSLATIONS[locale];
  if (!dictionary) return canonical;

  return canonical
    .split("/")
    .map((segment) => (isDynamic(segment) ? segment : (dictionary[segment] ?? segment)))
    .join("/");
}

/** Turns a route template into a regex capturing its dynamic segments, in order. */
function toPattern(template: string): RegExp {
  const source = template
    .split("/")
    .map((segment) => (isDynamic(segment) ? "([^/]+)" : segment.replace(/[.*+?^${}()|\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${source}$`);
}

const matcherCache = new Map<string, RouteMatcher[]>();

/** Route matchers for a locale, most specific first so `/orders/new` beats `/orders/[id]`. */
function getMatchers(locale: string): RouteMatcher[] {
  const cached = matcherCache.get(locale);
  if (cached) return cached;

  const matchers = CANONICAL_ROUTES.map((canonical) => {
    const localized = translateRoute(canonical, locale);
    return {
      canonical,
      localized,
      pattern: toPattern(localized),
      dynamicCount: canonical.split("/").filter(isDynamic).length,
    };
  }).sort((a, b) => a.dynamicCount - b.dynamicCount);

  matcherCache.set(locale, matchers);
  return matchers;
}

/** Splits `/path?query#hash` into the bare path and its suffix. */
function splitSuffix(href: string): [string, string] {
  const index = href.search(/[?#]/);
  return index === -1 ? [href, ""] : [href.slice(0, index), href.slice(index)];
}

/** Rebuilds a path from `template`, filling its `[param]` segments with `values`. */
function fillTemplate(template: string, values: string[]): string {
  let next = 0;
  return template
    .split("/")
    .map((segment) => (isDynamic(segment) ? values[next++] : segment))
    .join("/");
}

/** Pseudo-locale without translations: its routes are the canonical ones. */
const CANONICAL = "";

/** Matches `path` against the routes written in `from` and rewrites it in `to`. */
function convert(href: string, from: string, to: string): string {
  const [path, suffix] = splitSuffix(href);
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;

  for (const matcher of getMatchers(from)) {
    const match = matcher.pattern.exec(normalized);
    if (!match) continue;
    return fillTemplate(translateRoute(matcher.canonical, to), match.slice(1)) + suffix;
  }
  return href;
}

/**
 * Converts a canonical path into the URL path of a locale.
 *
 * @param href - Canonical path, optionally with a query string or hash (e.g. `/pets/3/edit?x=1`).
 * @param locale - Target locale.
 * @returns The localized path, or `href` unchanged when it is not a known route (external or 404).
 */
export function localizePath(href: string, locale: string): string {
  if (!href.startsWith("/")) return href;
  return convert(href, CANONICAL, locale);
}

/**
 * Converts a localized URL path (without locale prefix) back to the canonical route.
 *
 * @param path - Localized path as shown in the browser, e.g. `/receitas/criar`.
 * @param locale - Locale the path is written in.
 * @returns The canonical path, or `path` unchanged when it is not a known route.
 */
export function delocalizePath(path: string, locale: string): string {
  return convert(path, locale, CANONICAL);
}

/**
 * Builds the `pathnames` map consumed by next-intl's middleware: every canonical
 * route with its URL for each locale.
 *
 * @param locales - Supported locales.
 */
export function buildPathnames(locales: readonly string[]): Record<string, Record<string, string>> {
  return Object.fromEntries(
    CANONICAL_ROUTES.map((canonical) => [canonical, Object.fromEntries(locales.map((locale) => [locale, translateRoute(canonical, locale)]))])
  );
}
