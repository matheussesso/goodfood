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
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-full bg-white/85 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-4 pl-5 pr-2 sm:h-16">
          <Link href="/" className="flex shrink-0 items-center" aria-label={logoAlt}>
            <Image src="/goodfood-logo.png" alt={logoAlt} width={864} height={209} priority className="h-8 w-auto" />
          </Link>

          <nav aria-label={navLabel} className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <a key={link.anchor} href={`#${link.anchor}`} className="rounded-full px-4 py-2 text-sm font-medium text-gf-ink/75 transition-colors hover:bg-gf-rose hover:text-gf-red">
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gf-rose text-gf-red transition-colors hover:bg-gf-red hover:text-white lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div id="landing-mobile-menu" className="mx-auto mt-2 max-w-6xl rounded-3xl bg-white p-4 shadow-xl shadow-black/10 ring-1 ring-black/5 lg:hidden">
          <nav aria-label={navLabel} className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.anchor}
                href={`#${link.anchor}`}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold text-gf-ink hover:bg-gf-rose hover:text-gf-red"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <AuthCtas labels={ctaLabels} className="mt-3 flex flex-col gap-3 sm:hidden [&>a]:w-full" />
        </div>
      )}
    </header>
  );
}
