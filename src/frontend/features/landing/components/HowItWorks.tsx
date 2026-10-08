import { getTranslations } from "next-intl/server";
import { HOW_STEPS } from "@/features/landing/content";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";
import { SectionHeading } from "./SectionHeading";

/**
 * The 4-step journey of the system (pet, recipe, link, order), mirroring the
 * in-app guide, followed by the sign-up call to action.
 *
 * @param ctaLabels - Texts of the auth buttons.
 */
export async function HowItWorks({ ctaLabels }: { ctaLabels: AuthCtaLabels }) {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.how" });

  return (
    <section id="como-funciona" aria-labelledby="how-title" className="scroll-mt-24 px-3 py-4 sm:px-6">
      <div className="gf-paws mx-auto max-w-6xl space-y-10 rounded-[2.5rem] bg-gf-ink px-5 py-14 text-white sm:px-10 sm:py-20">
        <SectionHeading id="how-title" invert eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map(({ id, icon: Icon }, index) => (
            <li key={id} className="relative rounded-3xl bg-[#161616] p-6 ring-1 ring-white/10 transition-colors hover:bg-[#1d1d1d]">
              <span className="gf-display mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gf-red text-lg font-extrabold shadow-lg shadow-gf-red/40">
                {index + 1}
              </span>
              <Icon className="mb-3 h-6 w-6 text-white/70" aria-hidden="true" />
              <h3 className="text-lg font-bold">{t(`steps.${id}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">{t(`steps.${id}.desc`)}</p>
            </li>
          ))}
        </ol>

        <AuthCtas
          labels={ctaLabels}
          large
          primaryVariant="onDark"
          secondaryVariant="ghostOnDark"
          className="flex flex-col items-center justify-center gap-3 sm:flex-row [&>a]:w-full sm:[&>a]:w-auto"
        />
      </div>
    </section>
  );
}
