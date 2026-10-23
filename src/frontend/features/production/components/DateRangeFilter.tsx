"use client";

import { useTranslations } from "next-intl";
import { CalendarRange, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EMPTY_RANGE,
  RANGE_PRESETS,
  isRangeActive,
  matchingPreset,
  normalizeRange,
  presetRange,
  type DateRange,
} from "@/features/production/cycle";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/**
 * Period filter on the order placement date: "from"/"to" date fields (either
 * may stay empty for an open-ended period), quick shortcuts (last 7 days, last
 * 30 days, this month) and a clear button. Bounds typed out of order are swapped.
 *
 * @param value - Current period.
 * @param onChange - Receives the new, normalized period.
 */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const t = useTranslations("Production");
  const active = isRangeActive(value);
  const preset = matchingPreset(value);

  const update = (patch: Partial<DateRange>) => onChange(normalizeRange({ ...value, ...patch }));

  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
        {t("period")}
      </legend>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid grid-cols-2 gap-2 sm:max-w-md lg:w-80">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">{t("period_from")}</span>
            <Input
              type="date"
              value={value.from ?? ""}
              max={value.to ?? undefined}
              onChange={(event) => update({ from: event.target.value })}
              className="h-11"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">{t("period_to")}</span>
            <Input
              type="date"
              value={value.to ?? ""}
              min={value.from ?? undefined}
              onChange={(event) => update({ to: event.target.value })}
              className="h-11"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={preset === key}
              onClick={() => onChange(presetRange(key))}
              className={cn(
                "min-h-11 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                preset === key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t(`preset_${key}`)}
            </button>
          ))}
          {active && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_RANGE)}
              className="flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("period_clear")}
            </button>
          )}
        </div>
      </div>
    </fieldset>
  );
}
