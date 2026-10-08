import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 hover:-translate-y-0.5 active:translate-y-0 " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0";

const variants = {
  /** Main call to action on light backgrounds: brand red. */
  primary: "bg-gf-red text-white shadow-lg shadow-gf-red/30 hover:bg-gf-red-dark focus-visible:outline-gf-red",
  /** Secondary action on light backgrounds. */
  secondary: "bg-white text-gf-ink shadow-sm ring-1 ring-black/10 hover:ring-black/30 focus-visible:outline-gf-red",
  /** Solid white action placed over a red background. */
  onRed: "bg-white text-gf-red shadow-lg shadow-black/10 hover:bg-gf-cream focus-visible:outline-white",
  /** Translucent action placed over a red background. */
  ghostOnRed: "bg-white/15 text-white ring-1 ring-white/60 hover:bg-white/25 focus-visible:outline-white",
  /** Main action placed over a dark background. */
  onDark: "bg-gf-red text-white shadow-lg shadow-gf-red/40 hover:bg-gf-red-dark focus-visible:outline-white",
  /** Translucent action placed over a dark background. */
  ghostOnDark: "bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20 focus-visible:outline-white",
} as const;

export type LandingButtonVariant = keyof typeof variants;

/**
 * Class names for landing-page buttons rendered as links.
 *
 * @param variant - Visual style, chosen by the background it sits on.
 * @param large - Bigger padding and text for hero/final calls to action.
 * @param className - Extra classes merged last.
 */
export function landingButton(variant: LandingButtonVariant = "primary", large = false, className?: string): string {
  return cn(base, variants[variant], large && "min-h-12 px-8 py-3 text-base", className);
}
