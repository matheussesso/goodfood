"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Dog, Link2, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { JourneyStep, JourneyStepId } from "@/features/onboarding/journey";

const STEP_ICONS: Record<JourneyStepId, LucideIcon> = {
  pet: Dog,
  recipe: UtensilsCrossed,
  link: Link2,
  order: ShoppingBag,
};

/**
 * Highlights the one thing to do now: what it is, why it matters, and a single
 * button that goes straight there.
 *
 * @param step - The current journey step.
 */
export function NextStepCard({ step }: { step: JourneyStep }) {
  const t = useTranslations("Onboarding");
  const Icon = STEP_ICONS[step.id];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-card p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t("next_step")}</p>
        <h3 className="text-lg font-semibold text-foreground">{t(`step_${step.id}`)}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{t(`step_${step.id}_desc`)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t(`why_${step.id}`)}</p>
      </div>
      <Link href={step.href} className="shrink-0">
        <Button size="lg" className="w-full gap-2 sm:w-auto">
          {t(`cta_${step.id}`)} <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
