import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Use light text over red/black backgrounds. */
  invert?: boolean;
  align?: "left" | "center";
  id?: string;
}

/**
 * Eyebrow chip + title + subtitle block shared by every landing section.
 *
 * @param eyebrow - Short label shown in a pill above the title.
 * @param title - Section heading (rendered as `h2`).
 * @param subtitle - Optional supporting paragraph.
 * @param invert - Light text for dark backgrounds.
 * @param align - Text alignment on wide screens.
 * @param id - Id of the heading, referenced by `aria-labelledby`.
 */
export function SectionHeading({ eyebrow, title, subtitle, invert = false, align = "center", id }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl space-y-4", align === "center" ? "mx-auto text-center" : "text-left")}>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold",
          invert ? "bg-white/15 text-white" : "bg-gf-rose text-gf-red"
        )}
      >
        <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2 id={id} className={cn("gf-display text-3xl font-extrabold leading-tight sm:text-4xl", invert ? "text-white" : "text-gf-ink")}>
        {title}
      </h2>
      {subtitle && <p className={cn("text-base sm:text-lg", invert ? "text-white/80" : "text-gf-ink/65")}>{subtitle}</p>}
    </div>
  );
}
