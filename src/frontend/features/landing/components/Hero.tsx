import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { getWhatsappUrl } from "@/lib/company";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";
import { RecipeLabel } from "./RecipeLabel";

/**
 * First screen: a bold promise on brand red, the sign-up calls to action and a
 * live recipe label that shows how simple it is to build a pet's meal.
 *
 * @param ctaLabels - Texts of the auth buttons.
 */
export async function Hero({ ctaLabels }: { ctaLabels: AuthCtaLabels }) {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });
  const tLabel = await getTranslations({ locale: "pt", namespace: "Landing.hero.label" });

  const facts = [t("hero.badge_fresh"), t("hero.badge_vets"), t("hero.badge_delivery")];
  const copy = {
    title: tLabel("title"),
    meta: tLabel("meta"),
    hint: tLabel("hint"),
    total: tLabel("total"),
    note: tLabel("note"),
    empty: tLabel("empty"),
    logoAlt: t("a11y.logo_alt"),
    ingredients: {
      chicken: tLabel("ingredients.chicken"),
      pumpkin: tLabel("ingredients.pumpkin"),
      rice: tLabel("ingredients.rice"),
      liver: tLabel("ingredients.liver"),
      carrot: tLabel("ingredients.carrot"),
      spinach: tLabel("ingredients.spinach"),
    },
  };

  return (
    <section id="inicio" className="bg-gf-red text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-14 lg:pt-20">
        <div>
          <h1 className="gf-display text-[clamp(2.75rem,6.6vw,5.5rem)] font-extrabold leading-[0.98]">{t("hero.title")}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/85">{t("hero.subtitle")}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&_a]:w-full sm:[&_a]:w-auto">
            <AuthCtas labels={ctaLabels} large primaryVariant="onRed" secondaryVariant="ghostOnRed" className="contents" />
          </div>
          <a
            href={getWhatsappUrl(t("whatsapp_message"))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center text-[0.95rem] font-semibold underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
          >
            {t("cta.whatsapp")}
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
          <div className="pointer-events-none absolute -right-16 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-gf-red-dark/60 sm:h-[30rem] sm:w-[30rem]" aria-hidden="true" />
          <div className="relative">
            <RecipeLabel copy={copy} />
          </div>
        </div>
      </div>

      <ul className="mx-auto grid max-w-6xl gap-x-8 gap-y-3 border-t border-white/25 px-4 py-6 text-[0.95rem] font-semibold sm:grid-cols-3 sm:px-6">
        {facts.map((fact) => (
          <li key={fact} className="flex items-center gap-2.5">
            <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
