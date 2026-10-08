import { getTranslations } from "next-intl/server";
import { PROCESS_STEP_IDS } from "@/features/landing/content";
import { SectionHeading } from "./SectionHeading";

const FACT_IDS = ["where", "what", "who", "care"] as const;

/** Institutional section: who the company is, the key facts and how every meal is made. */
export async function About() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.about" });
  const tSteps = await getTranslations({ locale: "pt", namespace: "Landing.process.steps" });

  return (
    <section id="sobre" aria-labelledby="about-title" className="scroll-mt-16 bg-gf-blush py-20 sm:py-28">
      <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading id="about-title" title={t("title")} />
            <p className="mt-6 max-w-xl text-xl font-medium leading-snug text-gf-ink sm:text-2xl">{t("p1")}</p>
            <p className="mt-4 max-w-xl text-lg text-gf-ink/65">{t("p2")}</p>
          </div>

          <dl className="self-end">
            {FACT_IDS.map((id) => (
              <div key={id} className="grid gap-1 border-t border-gf-ink/15 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="text-sm font-bold text-gf-red">{t(`facts.${id}.label`)}</dt>
                <dd className="text-lg leading-snug text-gf-ink">{t(`facts.${id}.value`)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gf-ink">{t("process_title")}</h3>
          <ol className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-5">
            {PROCESS_STEP_IDS.map((id, index) => (
              <li key={id} className="border-t-2 border-gf-ink pt-4">
                <span className="gf-display block text-3xl font-extrabold leading-none text-gf-red" aria-hidden="true">
                  {index + 1}
                </span>
                <p className="mt-3 font-semibold leading-snug text-gf-ink">
                  <span className="sr-only">{index + 1}. </span>
                  {tSteps(`${id}.title`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
