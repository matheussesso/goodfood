"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_DURATION_DAYS = 14;
const STEP_DAYS = 7;

/**
 * Stepper for the subscription's total plan duration — starts at 14 days and
 * moves in 7-day increments (14, 21, 28, 35, ...), with no upper bound.
 *
 * @param value - Current duration in days.
 * @param onChange - Called with the new duration whenever it changes.
 * @param t - Subscriptions namespace translator.
 */
export function DurationStepper({
  value,
  onChange,
  t,
}: {
  value: number;
  onChange: (days: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const totalWeeks = Math.floor(value / STEP_DAYS);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border rounded-lg">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-r-none"
          onClick={() => onChange(Math.max(MIN_DURATION_DAYS, value - STEP_DAYS))}
          disabled={value <= MIN_DURATION_DAYS}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-16 text-center font-semibold text-foreground tabular-nums">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-l-none"
          onClick={() => onChange(value + STEP_DAYS)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-sm text-muted-foreground">
        {totalWeeks} {totalWeeks === 1 ? t("weeks_count") : t("weeks_count_plural")}
      </span>
    </div>
  );
}
