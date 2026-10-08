import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** Use light text over red/black backgrounds. */
  invert?: boolean;
  /** Id of the heading, referenced by `aria-labelledby`. */
  id?: string;
  className?: string;
}

/**
 * Left-aligned section title with an optional supporting paragraph.
 *
 * @param title - Section heading (rendered as `h2`).
 * @param subtitle - Optional supporting paragraph.
 * @param invert - Light text for dark backgrounds.
 * @param id - Id of the heading, referenced by `aria-labelledby`.
 * @param className - Extra classes for the wrapper.
 */
export function SectionHeading({ title, subtitle, invert = false, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h2 id={id} className={cn("gf-display text-4xl font-extrabold leading-[1.05] sm:text-5xl", invert ? "text-white" : "text-gf-ink")}>
        {title}
      </h2>
      {subtitle && <p className={cn("mt-4 max-w-xl text-lg leading-relaxed", invert ? "text-white/75" : "text-gf-ink/65")}>{subtitle}</p>}
    </div>
  );
}
