import { getTranslations } from "next-intl/server";
import { Heart, Leaf, Stethoscope } from "lucide-react";
import { PROCESS_STEPS } from "@/features/landing/content";
import { SectionHeading } from "./SectionHeading";

const VALUES = [
  { id: "natural", icon: Leaf },
  { id: "vets", icon: Stethoscope },
  { id: "care", icon: Heart },
] as const;

/** Institutional section: who the company is, its values and how every meal is made. */
export async function About() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.about" });
  const tSteps = await getTranslations({ locale: "pt", namespace: "Landing.process.steps" });

  return (
    <section id="sobre" aria-labelledby="about-title" className="scroll-mt-24 px-3 py-4 sm:px-6">
      <div className="gf-paws mx-auto max-w-6xl space-y-12 rounded-[2.5rem] bg-linear-to-br from-gf-red to-gf-red-dark px-5 py-14 text-white sm:px-10 sm:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="space-y-5">
            <SectionHeading id="about-title" invert align="left" eyebrow={t("eyebrow")} title={t("title")} />
            <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">{t("p1")}</p>
            <p className="max-w-xl text-base leading-relaxed text-white/80">{t("p2")}</p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {VALUES.map(({ id, icon: Icon }) => (
              <li key={id} className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3.5 text-base font-semibold ring-1 ring-white/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gf-red">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {t(`values.${id}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5 border-t border-white/20 pt-8">
          <h3 className="text-center text-sm font-semibold text-white/85">{t("process_title")}</h3>
          <ol className="grid gap-3 sm:grid-cols-5">
            {PROCESS_STEPS.map(({ id, icon: Icon }, index) => (
              <li key={id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 text-gf-ink sm:flex-col sm:text-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gf-rose text-gf-red">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold leading-snug">
                  <span className="sr-only">{index + 1}. </span>
                  {tSteps(`${id}.title`)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
