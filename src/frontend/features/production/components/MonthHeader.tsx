"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthHeaderProps {
  year: number;
  month: number;
  /** Orders placed in the month (after the filters). */
  ordersCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  className?: string;
}

/**
 * Month title with previous/next buttons and how many orders were placed in
 * it. Shared by the calendar and the list views.
 *
 * @param year - Visible year.
 * @param month - Visible month (0-based).
 * @param ordersCount - Orders placed in the month.
 * @param onPrevMonth - Goes to the previous month.
 * @param onNextMonth - Goes to the next month.
 * @param className - Extra classes for the wrapper.
 */
export function MonthHeader({ year, month, ordersCount, onPrevMonth, onNextMonth, className }: MonthHeaderProps) {
  const t = useTranslations("Production");

  const monthTitle = useMemo(() => {
    const raw = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [year, month]);

  const navButton = "flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className={cn("flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4", className)}>
      <button type="button" onClick={onPrevMonth} aria-label={t("prev_month")} className={navButton}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="text-center" aria-live="polite">
        <p className="font-semibold text-foreground">{monthTitle}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ordersCount > 0 ? t("orders_placed_month", { count: ordersCount }) : t("no_orders_month")}
        </p>
      </div>
      <button type="button" onClick={onNextMonth} aria-label={t("next_month")} className={navButton}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
