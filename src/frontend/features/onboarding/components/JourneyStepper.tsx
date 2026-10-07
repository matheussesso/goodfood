"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { JourneyStep } from "@/features/onboarding/journey";

interface JourneyStepperProps {
  steps: JourneyStep[];
  /** Hide the per-step description (used in tight spaces such as empty states). */
  compact?: boolean;
  className?: string;
}

/**
 * The 4-step path from adding a pet to the first order. Each step links to
 * where it is done; the current step is marked with `aria-current="step"`.
 *
 * @param steps - Steps with their status (see `getJourney`).
 * @param compact - Show titles only.
 */
export function JourneyStepper({ steps, compact = false, className }: JourneyStepperProps) {
  const t = useTranslations("Onboarding");

  return (
    <ol aria-label={t("journey_label")} className={cn("grid gap-3", compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {steps.map((step, index) => {
        const done = step.status === "done";
        const current = step.status === "current";

        return (
          <li key={step.id} aria-current={current ? "step" : undefined}>
            <Link
              href={step.href}
              className={cn(
                "flex h-full gap-3 rounded-xl border p-3 transition-colors min-h-[44px]",
                current && "border-primary bg-primary/5 shadow-sm",
                done && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20",
                step.status === "upcoming" && "bg-card hover:border-primary/40"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  done && "bg-emerald-500 text-white",
                  current && "bg-primary text-primary-foreground",
                  step.status === "upcoming" && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{t(`step_${step.id}`)}</span>
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t(`status_${step.status}`)}
                </span>
                {!compact && <span className="mt-1 block text-xs text-muted-foreground">{t(`step_${step.id}_desc`)}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
