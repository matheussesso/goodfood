"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";

interface LandingHeaderProps {
  links: { anchor: string; label: string }[];
  ctaLabels: AuthCtaLabels;
  logoAlt: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
  navLabel: string;
}

/**
 * Sticky top bar: logo, section anchors and the sign-in/sign-up actions.
 * On small screens the anchors collapse into a toggleable panel.
 *
 * @param links - Section anchors with their translated label.
 * @param ctaLabels - Texts of the auth buttons.
 * @param logoAlt - Alt text of the logo.
 * @param menuOpenLabel - Accessible label of the open-menu button.
 * @param menuCloseLabel - Accessible label of the close-menu button.
 * @param navLabel - Accessible label of the navigation landmark.
 */
export function LandingHeader({ links, ctaLabels, logoAlt, menuOpenLabel, menuCloseLabel, navLabel }: LandingHeaderProps) {
  const [open, setOpen] = useState(false);
  const user = useAuth((state) => state.user);

  return (
    <header className="sticky top-0 z-40 border-b border-gf-ink/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={logoAlt}>
          <Image src="/goodfood-logo.png" alt={logoAlt} width={864} height={209} priority className="h-8 w-auto" />
        </Link>

        <nav aria-label={navLabel} className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a key={link.anchor} href={`#${link.anchor}`} className="text-sm font-semibold text-gf-ink/70 transition-colors hover:text-gf-red">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AuthCtas labels={ctaLabels} hideSecondary={!!user} className="hidden items-center gap-2 sm:flex [&>a]:min-h-10 [&>a]:px-5 [&>a]:py-2" />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? menuCloseLabel : menuOpenLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gf-ink transition-colors hover:bg-gf-blush hover:text-gf-red lg:hidden"
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="landing-mobile-menu" className="border-t border-gf-ink/10 bg-white px-4 pb-5 pt-2 lg:hidden">
          <nav aria-label={navLabel} className="mx-auto flex max-w-6xl flex-col">
            {links.map((link) => (
              <a
                key={link.anchor}
                href={`#${link.anchor}`}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center border-b border-gf-ink/10 text-lg font-semibold text-gf-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <AuthCtas labels={ctaLabels} className="mx-auto mt-4 flex max-w-6xl flex-col gap-3 sm:hidden [&>a]:w-full" />
        </div>
      )}
    </header>
  );
}
