"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useDashboard } from "@/hooks/useDashboard";
import { getCurrentStep, getJourney } from "@/features/onboarding/journey";
import { JourneyStepper } from "@/features/onboarding/components/JourneyStepper";

interface JourneyEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Primary action(s). Defaults to the button of the customer's current journey step. */
  actions?: ReactNode;
  /** Used when `actions` is omitted and the journey is already finished. */
  fallbackAction?: { href: string; label: string };
}

/**
 * Empty-state card that also shows where the customer is in the journey, so
 * an empty list always answers "what do I do now?".
 *
 * @param icon - Illustration shown above the title.
 * @param title - What is empty.
 * @param description - Why and what to do.
 * @param actions - Call-to-action buttons (default: the current journey step).
 * @param fallbackAction - Button used when there is no pending step.
 */
export function JourneyEmptyState({ icon, title, description, actions, fallbackAction }: JourneyEmptyStateProps) {
  const t = useTranslations("Onboarding");
  const { data } = useDashboard();
  const current = data ? getCurrentStep(getJourney(data.progress)) : null;
  const action =
    actions ??
    (current ? (
      <Link href={current.href}>
        <Button size="lg">{t(`cta_${current.id}`)}</Button>
      </Link>
    ) : fallbackAction ? (
      <Link href={fallbackAction.href}>
        <Button size="lg">{fallbackAction.label}</Button>
      </Link>
    ) : null);

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <div className="mx-auto max-w-md space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
      {data && (
        <div className="space-y-2 border-t pt-5 text-left">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("empty_hint")}</p>
          <JourneyStepper steps={getJourney(data.progress)} compact />
        </div>
      )}
    </div>
  );
}
