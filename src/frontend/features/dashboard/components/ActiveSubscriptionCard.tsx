"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CalendarCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { parseApiDate } from "@/features/dashboard/dates";
import { sortRecipesByWeek } from "@/features/subscriptions/utils";
import type { Subscription } from "@/hooks/useSubscriptions";

/**
 * The running (or next-starting) weekly plan: week progress and this week's
 * recipe — or an empty state inviting to create one.
 *
 * @param subscription - The active plan, or null.
 */
export function ActiveSubscriptionCard({ subscription }: { subscription: Subscription | null }) {
  const t = useTranslations("Dashboard");
  const tSub = useTranslations("Subscriptions");
  const format = useFormatter();

  const total = subscription?.total_cycles ?? 0;
  const week = subscription?.current_cycle_index;
  const started = week !== null && week !== undefined;
  const recipe = subscription && started ? sortRecipesByWeek(subscription.recipes)[week] : undefined;
  const percent = total > 0 && started ? Math.round(((week + 1) / total) * 100) : 0;

  return (
    <section aria-labelledby="dashboard-subscription" className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
      <h2 id="dashboard-subscription" className="mb-4 flex items-center gap-2 text-base font-semibold">
        <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" /> {t("section_subscription")}
      </h2>

      {subscription ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{subscription.pet?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {started
                  ? tSub("current_week_progress", { current: String(week + 1), total: String(total) })
                  : t("starts_on", {
                      date: format.dateTime(parseApiDate(subscription.start_date), { day: "2-digit", month: "short", year: "numeric" }),
                    })}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-amber-600 dark:text-amber-400">R$ {formatBRL(subscription.estimated_price ?? 0)}</p>
          </div>

          {started && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={tSub("total_cycles_label")}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
          )}

          {recipe && (
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("this_week_recipe")}</p>
              <p className="text-sm font-medium">{recipe.name}</p>
            </div>
          )}

          <Link href={`/orders/subscriptions/${subscription.id}`} className="mt-auto">
            <Button variant="outline" className="w-full">
              {t("view_plan")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <p className="font-medium text-foreground">{t("no_subscription")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{t("no_subscription_desc")}</p>
          <Link href="/orders/subscriptions/new">
            <Button variant="outline">{t("create_subscription")}</Button>
          </Link>
        </div>
      )}
    </section>
  );
}
