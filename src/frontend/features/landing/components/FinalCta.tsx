import { getTranslations } from "next-intl/server";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";

/**
 * Closing call to action.
 *
 * @param ctaLabels - Texts of the auth buttons.
 */
export async function FinalCta({ ctaLabels }: { ctaLabels: AuthCtaLabels }) {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.final" });

  return (
    <section aria-labelledby="final-title" className="bg-gf-cream px-3 pb-10 sm:px-6">
      <div className="gf-paws mx-auto max-w-5xl space-y-6 rounded-[2.5rem] bg-linear-to-br from-gf-red to-gf-red-dark px-6 py-14 text-center text-white shadow-2xl shadow-gf-red/30 sm:py-16">
        <h2 id="final-title" className="gf-display mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto max-w-xl text-lg text-white/85">{t("subtitle")}</p>
        <AuthCtas
          labels={ctaLabels}
          large
          primaryVariant="onRed"
          secondaryVariant="ghostOnRed"
          className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row [&>a]:w-full sm:[&>a]:w-auto"
        />
      </div>
    </section>
  );
}
