"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DURATION_PRESETS, MAX_PLAN_DAYS, MIN_PLAN_DAYS, clampDuration } from "../meal-plan";

interface DurationStepperProps {
  /** Current duration in days. */
  value: number;
  /** Shortest duration allowed for this recipe. */
  min?: number;
  /** Called with the new (already clamped) duration. */
  onChange: (days: number) => void;
  /** Accessible name of the field, e.g. the recipe name. */
  label: string;
}

/**
 * Picks how many days a recipe lasts in a meal plan: −/+ in 1-day steps, a
 * typed value (applied on blur/Enter) and 7/15/30-day shortcuts. Values are
 * kept within `[min, MAX_PLAN_DAYS]`.
 *
 * @param value - Current duration in days.
 * @param min - Lower bound for this recipe (defaults to the plan minimum).
 * @param onChange - Receives the new duration.
 * @param label - Accessible name for the number field.
 */
export function DurationStepper({ value, min = MIN_PLAN_DAYS, onChange, label }: DurationStepperProps) {
  const t = useTranslations("Orders");
  /** Text being typed; null while the field simply mirrors `value`. */
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const next = clampDuration(Number(draft), min);
    setDraft(null);
    if (next !== value) onChange(next);
  };

  const stepButton = "flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg border bg-background">
        <button
          type="button"
          className={cn(stepButton, "rounded-l-lg")}
          onClick={() => onChange(clampDuration(value - 1, min))}
          disabled={value <= min}
          aria-label={t("duration_decrease")}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <label className="flex items-baseline gap-1 px-1">
          <span className="sr-only">{t("duration_of", { name: label })}</span>
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={MAX_PLAN_DAYS}
            value={draft ?? String(value)}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
            }}
            className="h-11 w-12 bg-transparent text-center text-base font-semibold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground" aria-hidden="true">{t("days_short")}</span>
        </label>
        <button
          type="button"
          className={cn(stepButton, "rounded-r-lg")}
          onClick={() => onChange(clampDuration(value + 1, min))}
          disabled={value >= MAX_PLAN_DAYS}
          aria-label={t("duration_increase")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-1.5" role="group" aria-label={t("duration_presets")}>
        {DURATION_PRESETS.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => onChange(days)}
            disabled={days < min}
            aria-pressed={value === days}
            className={cn(
              "h-11 min-w-11 rounded-lg border px-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
              value === days ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t("days_value", { count: days })}
          </button>
        ))}
      </div>
    </div>
  );
}
