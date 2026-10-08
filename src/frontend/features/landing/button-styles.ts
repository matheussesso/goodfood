import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[0.95rem] font-semibold transition-colors duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2";

const variants = {
  /** Main call to action on light backgrounds: brand red. */
  primary: "bg-gf-red text-white hover:bg-gf-red-dark focus-visible:outline-gf-red",
  /** Secondary action on light backgrounds. */
  secondary: "bg-white text-gf-ink ring-1 ring-gf-ink/20 hover:ring-gf-ink/60 focus-visible:outline-gf-red",
  /** Solid white action placed over a red background. */
  onRed: "bg-white text-gf-red hover:bg-gf-blush focus-visible:outline-white",
  /** Outlined action placed over a red background. */
  ghostOnRed: "text-white ring-1 ring-white/70 hover:bg-white/10 focus-visible:outline-white",
  /** Main action placed over a dark background. */
  onDark: "bg-gf-red text-white hover:bg-gf-red-dark focus-visible:outline-white",
  /** Outlined action placed over a dark background. */
  ghostOnDark: "text-white ring-1 ring-white/35 hover:bg-white/10 focus-visible:outline-white",
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
