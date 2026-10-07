"use client";

import { useFormatter, useTranslations } from "next-intl";
import { AlertTriangle, CreditCard, MapPin, Syringe, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { parseApiDate } from "@/features/dashboard/dates";
import type { DashboardAlerts, DashboardProgress } from "@/hooks/useDashboard";

interface AlertItem {
  key: string;
  icon: LucideIcon;
  tone: "warning" | "danger" | "info";
  text: string;
  actionLabel: string;
  href: string;
}

const TONE_CLASSES: Record<AlertItem["tone"], string> = {
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200",
};

/**
 * Lists what needs attention: unpaid invoices, overdue vaccines, incomplete pet
 * profiles and a missing delivery address. Renders nothing when all is well.
 *
 * @param alerts - Alert data from the dashboard summary.
 * @param progress - Used to know whether the delivery address is missing.
 */
export function AlertsBar({ alerts, progress }: { alerts: DashboardAlerts; progress: DashboardProgress }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const date = (value: string) => format.dateTime(parseApiDate(value), { day: "2-digit", month: "short", year: "numeric" });

  const items: AlertItem[] = [];

  if (alerts.pending_invoices.length > 0) {
    const first = alerts.pending_invoices[0];
    items.push({
      key: "invoices",
      icon: CreditCard,
      tone: "danger",
      text: `${t("alert_invoice", { count: alerts.pending_invoices.length })}${
        first.due_date ? ` · ${t("alert_invoice_due", { order: first.order_id, date: date(first.due_date) })}` : ""
      }`,
      actionLabel: t("action_view_order"),
      href: `/orders/${first.order_id}`,
    });
  }

  for (const vaccine of alerts.overdue_vaccines) {
    items.push({
      key: `vaccine-${vaccine.pet_id}-${vaccine.vaccine_name}`,
      icon: Syringe,
      tone: "warning",
      text: t("alert_vaccine", { pet: vaccine.pet_name, vaccine: vaccine.vaccine_name, date: date(vaccine.next_due_date) }),
      actionLabel: t("action_update_pet"),
      href: `/pets/${vaccine.pet_id}/edit`,
    });
  }

  for (const pet of alerts.incomplete_pets) {
    items.push({
      key: `incomplete-${pet.pet_id}`,
      icon: AlertTriangle,
      tone: "info",
      text: t("alert_incomplete", { pet: pet.pet_name, fields: pet.missing.map((field) => t(`missing_${field}`)).join(", ") }),
      actionLabel: t("action_complete_pet"),
      href: `/pets/${pet.pet_id}/edit`,
    });
  }

  if (!progress.has_address && progress.pets_count > 0) {
    items.push({
      key: "address",
      icon: MapPin,
      tone: "info",
      text: t("alert_address"),
      actionLabel: t("action_complete_address"),
      href: "/profile?section=address",
    });
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="dashboard-alerts" className="space-y-2">
      <h2 id="dashboard-alerts" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("section_alerts")}
      </h2>
      <ul className="space-y-2">
        {items.map(({ key, icon: Icon, tone, text, actionLabel, href }) => (
          <li key={key} className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center ${TONE_CLASSES[tone]}`}>
            <span className="flex min-w-0 flex-1 items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{text}</span>
            </span>
            <Link href={href} className="shrink-0 text-xs font-semibold underline underline-offset-4 hover:no-underline">
              {actionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
