"use client";

import { useTranslations } from "next-intl";
import { Check, Circle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Completeness } from "@/features/profile/completeness";

const LABEL_KEYS = {
  contact: "item_contact",
  address: "item_address",
  pet: "item_pet",
} as const;

/**
 * Checklist card showing how complete the customer's account is.
 * Collapses to a short success message once everything is filled.
 *
 * @param completeness - Result of `getCompleteness`.
 */
export function AccountCompleteness({ completeness }: { completeness: Completeness }) {
  const t = useTranslations("Profile");
  const { items, percent, isComplete } = completeness;

  if (isComplete) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("completeness_done")}
      </p>
    );
  }

  return (
    <section aria-labelledby="completeness-title" className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="completeness-title" className="text-sm font-semibold text-foreground">{t("completeness_title")}</h2>
        <span className="text-xs text-muted-foreground">{t("completeness_percent", { percent })}</span>
      </div>
      <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t("completeness_title")} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.key}>
            {item.done ? (
              <span className="flex min-h-9 items-center gap-2 text-sm text-muted-foreground line-through">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {t(LABEL_KEYS[item.key])}
              </span>
            ) : (
              <Link href={item.href} className="flex min-h-11 items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {t(LABEL_KEYS[item.key])}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
