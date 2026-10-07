"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentStep, getJourney } from "@/features/onboarding/journey";
import { useOnboarding, type DashboardProgress } from "@/hooks/useDashboard";

/**
 * Slim reminder shown after the guide was dismissed but the journey is not
 * finished: links to the pending step and lets the user bring the guide back.
 *
 * @param progress - Dashboard progress counts.
 */
export function ContinueSetupBanner({ progress }: { progress: DashboardProgress }) {
  const t = useTranslations("Onboarding");
  const { restoreGuide, isRestoring } = useOnboarding();
  const current = getCurrentStep(getJourney(progress));

  if (!current) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <Link href={current.href} className="font-medium text-foreground hover:text-primary">
          {t("continue_setup", { step: t(`step_${current.id}`) })}
        </Link>
      </span>
      <Button variant="ghost" size="sm" onClick={() => restoreGuide()} disabled={isRestoring} className="shrink-0">
        {t("show_guide")}
      </Button>
    </div>
  );
}
