import type { ReactNode } from "react";
import { AlertTriangle, Check, CreditCard, Dog, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Illustrative, static miniatures of system screens with made-up data. They are
 * markup (not screenshots) so they stay sharp, light and consistent with the
 * brand on every screen size. No prices are shown.
 */

/** Panel with a title bar that wraps a mock screen. */
export function MockWindow({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white text-gf-ink shadow-xl shadow-black/20", className)}>
      <p className="border-b border-gf-ink/10 px-5 py-3 text-sm font-bold">{title}</p>
      <div className="p-5">{children}</div>
    </div>
  );
}

interface RecipeMockProps {
  title: string;
  totalLabel: string;
}

/** Recipe with ingredient quantities and a "calculated automatically" total (no prices shown). */
export function RecipeMock({ title, totalLabel }: RecipeMockProps) {
  const rows: [string, string, number][] = [
    ["Peito de frango", "180 g", 100],
    ["Abóbora", "90 g", 50],
    ["Arroz integral", "70 g", 39],
    ["Fígado bovino", "30 g", 17],
  ];

  return (
    <MockWindow title={title}>
      <ul className="space-y-4">
        {rows.map(([name, quantity, width]) => (
          <li key={name}>
            <div className="flex justify-between text-sm font-semibold">
              <span>{name}</span>
              <span className="tabular-nums text-gf-ink/55">{quantity}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-gf-ink/10">
              <div className="h-full rounded-full bg-gf-red" style={{ width: `${width}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-center gap-2 rounded-xl bg-gf-ink px-4 py-3 text-sm font-semibold text-white">
        <Check className="h-4 w-4" aria-hidden="true" />
        {totalLabel}
      </p>
    </MockWindow>
  );
}

interface PetMockProps {
  title: string;
  name: string;
  meta: string;
  vaccine: string;
  restriction: string;
}

/** Pet profile card with a vaccine status chip and a dietary restriction. */
export function PetMock({ title, name, meta, vaccine, restriction }: PetMockProps) {
  return (
    <MockWindow title={title}>
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gf-blush text-gf-red">
          <Dog className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <p className="gf-display text-2xl font-extrabold leading-tight">{name}</p>
          <p className="text-sm text-gf-ink/60">{meta}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gf-leaf/10 px-3.5 py-1.5 text-gf-leaf">
          <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
          {vaccine}
        </span>
        <span className="rounded-full bg-gf-blush px-3.5 py-1.5 text-gf-red">{restriction}</span>
      </div>
    </MockWindow>
  );
}

interface OrderMockProps {
  title: string;
  steps: string[];
  /** Index of the step currently in progress. */
  currentIndex: number;
}

/** Order status timeline with finished, current and upcoming steps. */
export function OrderMock({ title, steps, currentIndex }: OrderMockProps) {
  return (
    <MockWindow title={title}>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li key={step} aria-current={current ? "step" : undefined} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-gf-ink text-white",
                  current && "bg-gf-red text-white ring-4 ring-gf-red/20",
                  !done && !current && "bg-gf-ink/10 text-gf-ink/45"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("text-sm font-semibold", !done && !current && "text-gf-ink/45")}>{step}</span>
            </li>
          );
        })}
      </ol>
    </MockWindow>
  );
}

interface AlertsMockProps {
  title: string;
  invoice: string;
  vaccine: string;
  incomplete: string;
}

/** Home-screen alerts: pending invoice, vaccine due and incomplete pet profile. */
export function AlertsMock({ title, invoice, vaccine, incomplete }: AlertsMockProps) {
  const rows = [
    { icon: CreditCard, text: invoice, tone: "bg-gf-red text-white" },
    { icon: Syringe, text: vaccine, tone: "bg-gf-blush text-gf-ink" },
    { icon: AlertTriangle, text: incomplete, tone: "bg-gf-ink/5 text-gf-ink" },
  ];

  return (
    <MockWindow title={title}>
      <ul className="space-y-2.5">
        {rows.map(({ icon: Icon, text, tone }) => (
          <li key={text} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold", tone)}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}
