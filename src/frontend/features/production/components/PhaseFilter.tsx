"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  PHASES,
  PHASE_LABEL_KEYS,
  PHASE_STYLE,
  areAllPhasesSelected,
  type Phase,
} from "@/features/production/cycle";

interface PhaseFilterProps {
  /** Phases currently shown on the calendar (at least one). */
  selected: Phase[];
  /** Number of entries of each phase in the visible month. */
  counts: Record<Phase, number>;
  onToggle: (phase: Phase) => void;
  onSelectAll: () => void;
}

/**
 * Multi-select chips for the production cycle phases. Each chip shows how many
 * orders it adds to the visible month; "all phases" selects everything at once.
 *
 * @param selected - Selected phases.
 * @param counts - Entries per phase in the month.
 * @param onToggle - Called when a phase chip is clicked.
 * @param onSelectAll - Called when "all phases" is clicked.
 */
export function PhaseFilter({ selected, counts, onToggle, onSelectAll }: PhaseFilterProps) {
  const t = useTranslations("Production");
  const all = areAllPhasesSelected(selected);

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-muted-foreground">{t("cycle_phase")}</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={all}
          onClick={onSelectAll}
          className={cn(
            "min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
            all ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          {t("all_phases")}
        </button>

        {PHASES.map((phase) => {
          const { Icon, chipActive, chipInactive } = PHASE_STYLE[phase];
          const active = selected.includes(phase);
          return (
            <button
              key={phase}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(phase)}
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                active ? chipActive : chipInactive
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t(PHASE_LABEL_KEYS[phase])}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center text-[10px] font-bold tabular-nums",
                  active ? "bg-white/25" : "bg-muted text-muted-foreground"
                )}
                aria-label={t("phase_count", { count: counts[phase] })}
              >
                {counts[phase]}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">{t("phases_hint")}</p>
    </fieldset>
  );
}
