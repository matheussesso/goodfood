import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Check, MessageCircle, Truck } from "lucide-react";
import { getWhatsappUrl } from "@/lib/company";
import { landingButton } from "@/features/landing/button-styles";
import { AuthCtas, type AuthCtaLabels } from "./AuthCtas";
import { RecipeMock } from "./mockups";

/** Small white pill floating over the hero visual. */
function FloatingChip({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div
      className={`gf-float flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 text-sm font-semibold text-gf-ink shadow-xl shadow-black/15 ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gf-rose text-gf-red">{icon}</span>
      {children}
    </div>
  );
}

/**
 * First screen: promise, sign-up call to action, trust badges and a friendly
 * visual of the brand next to a miniature of the recipe screen.
 *
 * @param ctaLabels - Texts of the auth buttons.
 */
export async function Hero({ ctaLabels }: { ctaLabels: AuthCtaLabels }) {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });
  const badges = [t("hero.badge_vets"), t("hero.badge_fresh")];

  return (
    <section id="inicio" className="relative overflow-hidden bg-linear-to-b from-gf-cream to-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gf-red/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-20 lg:pt-36">
        <div className="space-y-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gf-ink shadow-sm ring-1 ring-black/5">
            <span className="h-2 w-2 rounded-full bg-gf-red" aria-hidden="true" />
            {t("hero.eyebrow")}
          </p>

          <h1 className="gf-display text-4xl font-extrabold leading-[1.1] text-gf-ink sm:text-5xl">
            {t.rich("hero.title", { hl: (chunks) => <span className="text-gf-red">{chunks}</span> })}
          </h1>

          <p className="max-w-xl text-lg text-gf-ink/70">{t("hero.subtitle")}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&_a]:w-full sm:[&_a]:w-auto">
            <AuthCtas labels={ctaLabels} large className="contents" />
            <a href={getWhatsappUrl(t("whatsapp_message"))} target="_blank" rel="noopener noreferrer" className={landingButton("secondary", true)}>
              <MessageCircle className="h-5 w-5 text-gf-red" aria-hidden="true" /> {t("cta.whatsapp")}
            </a>
          </div>

          <ul className="flex flex-wrap gap-2 pt-1">
            {badges.map((badge) => (
              <li key={badge} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-gf-ink/80 shadow-sm ring-1 ring-black/5">
                <Check className="h-3.5 w-3.5 text-gf-red" strokeWidth={3} aria-hidden="true" />
                {badge}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md pb-10 lg:max-w-none">
          <div className="gf-paws relative rounded-[2.5rem] bg-linear-to-br from-gf-red to-gf-red-dark p-5 pb-0 shadow-2xl shadow-gf-red/30 sm:p-8 sm:pb-0">
            <div className="rounded-3xl bg-white p-4 shadow-xl shadow-black/20">
              <Image src="/goodfood-logo-pet.png" alt={t("a11y.logo_alt")} width={779} height={448} priority className="mx-auto h-auto w-full max-w-[16rem]" />
            </div>
            <div className="relative -mb-10 mx-auto mt-5 w-[90%]" aria-hidden="true">
              <RecipeMock title={t("hero.card_title")} totalLabel={t("hero.card_hint")} />
            </div>
          </div>

          <FloatingChip icon={<Truck className="h-4 w-4" />} className="absolute -top-5 left-5 sm:left-8">
            {t("hero.badge_delivery")}
          </FloatingChip>
        </div>
      </div>
    </section>
  );
}
