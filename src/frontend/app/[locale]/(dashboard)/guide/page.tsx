"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Dog, Lightbulb, Link2, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { getCurrentStep, getJourney, getStepHref, JOURNEY_ORDER, type JourneyStepId } from "@/features/onboarding/journey";
import { JourneyStepper } from "@/features/onboarding/components/JourneyStepper";

const STEP_ICONS: Record<JourneyStepId, LucideIcon> = { pet: Dog, recipe: UtensilsCrossed, link: Link2, order: ShoppingBag };
const STEP_KEYS: Record<JourneyStepId, "s1" | "s2" | "s3" | "s4"> = { pet: "s1", recipe: "s2", link: "s3", order: "s4" };
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

/**
 * "How it works": explains the path from adding a pet to the first order,
 * shows the customer where they are on it, and answers the common questions.
 */
export default function GuidePage() {
  const t = useTranslations("Guide");
  const tOnboarding = useTranslations("Onboarding");
  const { user } = useAuth();
  const { data } = useDashboard(user?.role === "customer");

  const steps = data ? getJourney(data.progress) : null;
  const current = steps ? getCurrentStep(steps) : null;

  return (
    <div className="mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {steps && <JourneyStepper steps={steps} compact />}

      <section aria-labelledby="guide-flow" className="space-y-4">
        <h2 id="guide-flow" className="text-lg font-semibold">
          {t("flow_title")}
        </h2>
        <ol className="space-y-4">
          {JOURNEY_ORDER.map((id) => {
            const Icon = STEP_ICONS[id];
            const key = STEP_KEYS[id];
            const status = steps?.find((step) => step.id === id)?.status;

            return (
              <li key={id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{t(`${key}_title`)}</h3>
                    {status && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {tOnboarding(`status_${status}`)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{t(`${key}_what`)}</p>
                  <p className="text-sm text-muted-foreground">{t(`${key}_why`)}</p>
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                    {t(`${key}_tip`)}
                  </p>
                </div>
                {data && (
                  <Link href={getStepHref(id, data.progress)} className="shrink-0 sm:self-center">
                    <Button variant={status === "current" ? "default" : "outline"} className="w-full gap-1.5 sm:w-auto">
                      {tOnboarding(`cta_${id}`)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="guide-faq" className="space-y-3">
        <h2 id="guide-faq" className="text-lg font-semibold">
          {t("faq_title")}
        </h2>
        <div className="divide-y rounded-xl border bg-card shadow-sm">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group px-5 py-3">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                {t(key)}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-2 pt-1 text-sm text-muted-foreground">{t(`a${key.slice(1)}` as "a1")}</p>
            </details>
          ))}
        </div>
      </section>

      {current && (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-base font-semibold">{t("ready_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("ready_desc")}</p>
          </div>
          <Link href={current.href}>
            <Button className="gap-1.5">
              {tOnboarding(`cta_${current.id}`)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </section>
      )}
    </div>
  );
}
