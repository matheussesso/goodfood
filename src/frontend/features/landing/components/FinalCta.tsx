import { getTranslations } from "next-intl/server";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";

/**
 * Closing call to action on brand red.
 *
 * @param ctaLabels - Texts of the auth buttons.
 */
export async function FinalCta({ ctaLabels }: { ctaLabels: AuthCtaLabels }) {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.final" });

  return (
    <section aria-labelledby="final-title" className="bg-gf-red py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="final-title" className="gf-display max-w-3xl text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[1]">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-xl text-lg text-white/85">{t("subtitle")}</p>
        <AuthCtas
          labels={ctaLabels}
          large
          primaryVariant="onRed"
          secondaryVariant="ghostOnRed"
          className="mt-9 flex flex-col gap-3 sm:flex-row [&>a]:w-full sm:[&>a]:w-auto"
        />
      </div>
    </section>
  );
}
