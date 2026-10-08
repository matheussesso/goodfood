import { getTranslations } from "next-intl/server";
import { HOW_STEP_IDS } from "@/features/landing/content";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";
import { SectionHeading } from "./SectionHeading";

/**
 * The four steps that take a customer from sign-up to the first order. They
 * are a real sequence, so they are numbered.
 *
 * @param ctaLabels - Texts of the auth buttons.
 */
export async function HowItWorks({ ctaLabels }: { ctaLabels: AuthCtaLabels }) {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.how" });

  return (
    <section id="como-funciona" aria-labelledby="how-title" className="scroll-mt-16 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="how-title" title={t("title")} subtitle={t("subtitle")} />

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {HOW_STEP_IDS.map((id, index) => (
            <li key={id} className="border-t-2 border-gf-ink pt-5">
              <span className="gf-display block text-6xl font-extrabold leading-none text-gf-red" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-bold text-gf-ink">
                <span className="sr-only">{index + 1}. </span>
                {t(`steps.${id}.title`)}
              </h3>
              <p className="mt-2 leading-relaxed text-gf-ink/65">{t(`steps.${id}.desc`)}</p>
            </li>
          ))}
        </ol>

        <AuthCtas
          labels={ctaLabels}
          large
          className="mt-14 flex flex-col gap-3 sm:flex-row [&>a]:w-full sm:[&>a]:w-auto"
        />
      </div>
    </section>
  );
}
