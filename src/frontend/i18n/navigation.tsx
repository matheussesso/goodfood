"use client";

import { useMemo, type ComponentProps } from "react";
import { useLocale } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { delocalizePath, localizePath } from "./pathnames";

/**
 * Locale-prefix handling only: URL translation is done by the wrappers below so
 * call sites can keep passing plain canonical strings such as `/pets/${id}/edit`.
 */
const base = createNavigation({
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
  localePrefix: "as-needed",
});

type NavigateOptions = Parameters<ReturnType<typeof base.useRouter>["push"]>[1];

/**
 * Locale-aware link. `href` is the canonical route (e.g. `/recipes/new?pet_id=3`);
 * the rendered URL is translated for the active (or given) locale.
 */
export function Link({ href, locale, ...props }: Omit<ComponentProps<typeof base.Link>, "href"> & { href: string }) {
  const current = useLocale();
  return <base.Link {...props} locale={locale} href={localizePath(href, locale ?? current)} />;
}

/**
 * Router whose `push`/`replace`/`prefetch` accept canonical routes and navigate
 * to the localized URL.
 */
export function useRouter() {
  const router = base.useRouter();
  const current = useLocale();

  return useMemo(() => {
    const localize = (href: string, options?: NavigateOptions) => localizePath(href, options?.locale ?? current);
    return {
      ...router,
      push: (href: string, options?: NavigateOptions) => router.push(localize(href, options), options),
      replace: (href: string, options?: NavigateOptions) => router.replace(localize(href, options), options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(localizePath(href, options?.locale ?? current), options),
    };
  }, [router, current]);
}

/**
 * Current path without the locale prefix, converted back to the canonical route
 * (e.g. `/receitas/criar` becomes `/recipes/new`) so comparisons stay language-independent.
 */
export function usePathname(): string {
  const pathname = base.usePathname();
  const current = useLocale();
  return delocalizePath(pathname, current);
}
