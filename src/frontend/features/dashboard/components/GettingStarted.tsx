"use client";

import { useTranslations } from "next-intl";
import { Check, MapPin, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { countDone, getCurrentStep, getJourney } from "@/features/onboarding/journey";
import { JourneyStepper } from "@/features/onboarding/components/JourneyStepper";
import { NextStepCard } from "@/features/onboarding/components/NextStepCard";
import { useOnboarding, type DashboardProgress } from "@/hooks/useDashboard";

interface GettingStartedProps {
  progress: DashboardProgress;
  name: string;
}

/**
 * Guided onboarding for accounts that have not placed a first order: welcome,
 * progress, the 4-step path, the one next action and the (optional) address.
 * Can be dismissed; the dashboard then keeps a slim "continue setup" banner.
 *
 * @param progress - Dashboard progress counts.
 * @param name - The customer's first name, for the greeting.
 */
export function GettingStarted({ progress, name }: GettingStartedProps) {
  const t = useTranslations("Onboarding");
  const { dismissGuide, isDismissing } = useOnboarding();

  const steps = getJourney(progress);
  const current = getCurrentStep(steps);
  const done = countDone(steps);
  const percent = Math.round((done / steps.length) * 100);

  return (
    <section aria-labelledby="getting-started" className="space-y-5 rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="getting-started" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("welcome_title", { name })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("welcome_desc")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => dismissGuide()} disabled={isDismissing} className="shrink-0 gap-1.5 text-muted-foreground">
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("dismiss")}</span>
          <span className="sr-only sm:hidden">{t("dismiss")}</span>
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{t("progress", { done, total: steps.length })}</span>
          <span>{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t("progress", { done, total: steps.length })}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <JourneyStepper steps={steps} />

      {current && <NextStepCard step={current} />}

      <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-card/60 px-4 py-3 text-sm sm:flex-row sm:items-center">
        <span className="flex min-w-0 flex-1 items-start gap-2.5">
          {progress.has_address ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          ) : (
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <span>
            <span className="font-medium text-foreground">{progress.has_address ? t("address_done") : t("address_title")}</span>
            {!progress.has_address && <span className="block text-xs text-muted-foreground">{t("address_desc")}</span>}
          </span>
        </span>
        {!progress.has_address && (
          <Link href="/profile?section=address" className="shrink-0 text-xs font-semibold text-primary underline underline-offset-4 hover:no-underline">
            {t("address_cta")}
          </Link>
        )}
      </div>

      <Link href="/guide" className="inline-block text-sm font-medium text-primary hover:underline">
        {t("open_guide")} →
      </Link>
    </section>
  );
}
