"use client";

import { useTranslations } from "next-intl";
import { CircleHelp, Dog, ShoppingBag, UserCircle, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

const ACTIONS: { href: string; labelKey: "qa_new_order" | "qa_new_recipe" | "qa_new_pet" | "qa_guide" | "qa_profile"; icon: LucideIcon }[] = [
  { href: "/orders/new", labelKey: "qa_new_order", icon: ShoppingBag },
  { href: "/recipes/new", labelKey: "qa_new_recipe", icon: UtensilsCrossed },
  { href: "/pets/new", labelKey: "qa_new_pet", icon: Dog },
  { href: "/guide", labelKey: "qa_guide", icon: CircleHelp },
  { href: "/profile", labelKey: "qa_profile", icon: UserCircle },
];

/**
 * One-tap shortcuts to the most common actions.
 */
export function QuickActions() {
  const t = useTranslations("Dashboard");

  return (
    <section aria-labelledby="dashboard-quick" className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 id="dashboard-quick" className="mb-3 text-base font-semibold">
        {t("section_quick")}
      </h2>
      <ul className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ href, labelKey, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
