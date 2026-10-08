import type { ReactNode } from "react";
import { AlertTriangle, Check, CreditCard, Dog, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Illustrative, static miniatures of system screens with made-up data. They are
 * markup (not screenshots) so they stay sharp, light and consistent with the
 * brand on every screen size.
 */

/** Soft window frame that wraps a mock screen. */
export function MockWindow({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/10 ring-1 ring-black/5", className)}>
      <div className="flex items-center gap-1.5 bg-gf-cream px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-gf-red/80" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" aria-hidden="true" />
        <span className="ml-2 truncate text-xs font-semibold text-gf-ink/60">{title}</span>
      </div>
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
    ["Peito de frango", "180 g", 78],
    ["Abóbora", "90 g", 45],
    ["Arroz integral", "70 g", 38],
    ["Fígado bovino", "30 g", 20],
  ];

  return (
    <MockWindow title={title}>
      <ul className="space-y-3.5">
        {rows.map(([name, quantity, width]) => (
          <li key={name} className="space-y-1.5">
            <div className="flex justify-between text-sm font-semibold text-gf-ink">
              <span>{name}</span>
              <span className="font-medium text-gf-ink/50">{quantity}</span>
            </div>
            <div className="h-2 rounded-full bg-gf-rose">
              <div className="h-full rounded-full bg-linear-to-r from-gf-red to-rose-400" style={{ width: `${width}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-center gap-2 rounded-2xl bg-gf-ink px-4 py-2.5 text-xs font-semibold text-white">
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
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gf-rose text-gf-red">
          <Dog className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <p className="gf-display text-xl font-extrabold text-gf-ink">{name}</p>
          <p className="text-sm text-gf-ink/60">{meta}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
          <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
          {vaccine}
        </span>
        <span className="rounded-full bg-gf-rose px-3 py-1.5 text-gf-red">{restriction}</span>
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
      <ol className="space-y-3.5">
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
                  !done && !current && "bg-gf-cream text-gf-ink/40"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("text-sm font-semibold", !done && !current && "text-gf-ink/40")}>{step}</span>
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
    { icon: CreditCard, text: invoice, tone: "bg-gf-rose text-gf-red" },
    { icon: Syringe, text: vaccine, tone: "bg-amber-50 text-amber-800" },
    { icon: AlertTriangle, text: incomplete, tone: "bg-sky-50 text-sky-800" },
  ];

  return (
    <MockWindow title={title}>
      <ul className="space-y-2.5">
        {rows.map(({ icon: Icon, text, tone }) => (
          <li key={text} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold", tone)}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}
