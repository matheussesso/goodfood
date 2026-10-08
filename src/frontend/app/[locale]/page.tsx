import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { company } from "@/lib/company";
import { bricolage, figtree } from "@/features/landing/fonts";
import { NAV_ITEMS } from "@/features/landing/content";
import { buildFaqJsonLd, buildOrganizationJsonLd, serializeJsonLd } from "@/features/landing/json-ld";
import { About } from "@/features/landing/components/About";
import { Faq } from "@/features/landing/components/Faq";
import { FinalCta } from "@/features/landing/components/FinalCta";
import { Footer } from "@/features/landing/components/Footer";
import { Hero } from "@/features/landing/components/Hero";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { Plans } from "@/features/landing/components/Plans";
import { SystemShowcase } from "@/features/landing/components/SystemShowcase";
import { WhatsAppFab } from "@/features/landing/components/WhatsAppFab";

/**
 * Landing page metadata. The copy is Portuguese-only, so the other locale URLs
 * point their canonical to the Portuguese page and stay out of the index.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: "pt", namespace: "Landing.meta" });
  const image = { url: "/og-image.png", width: 1200, height: 630, alt: t("og_alt") };

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: { canonical: "/" },
    robots: locale === "pt" ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: "/",
      siteName: company.name,
      title: t("title"),
      description: t("description"),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description"), images: [image.url] },
  };
}

/**
 * Public landing page: presents the company and the system and sends visitors
 * to sign up or sign in. All copy is Portuguese (`Landing` namespace, loaded
 * explicitly with the `pt` locale), whichever locale prefix the URL carries.
 */
export default async function LandingPage() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });
  const tFaq = await getTranslations({ locale: "pt", namespace: "Landing.faq.items" });

  const ctaLabels = { login: t("cta.login"), register: t("cta.register_free"), dashboard: t("cta.dashboard") };
  const headerLabels = { ...ctaLabels, register: t("cta.register") };
  const links = NAV_ITEMS.map((item) => ({ anchor: item.anchor, label: t(`nav.${item.labelKey}`) }));

  return (
    <div lang="pt-BR" className={`landing ${bricolage.variable} ${figtree.variable} min-h-screen bg-white text-gf-ink antialiased`}>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:font-semibold focus:shadow-xl focus:ring-2 focus:ring-gf-red"
      >
        {t("a11y.skip")}
      </a>

      <LandingHeader
        links={links}
        ctaLabels={headerLabels}
        logoAlt={t("a11y.logo_alt")}
        menuOpenLabel={t("a11y.menu_open")}
        menuCloseLabel={t("a11y.menu_close")}
        navLabel={t("a11y.main_nav")}
      />

      <main id="conteudo">
        <Hero ctaLabels={ctaLabels} />
        <HowItWorks ctaLabels={ctaLabels} />
        <SystemShowcase />
        <Plans />
        <About />
        <Faq />
        <FinalCta ctaLabels={ctaLabels} />
      </main>

      <Footer />
      <WhatsAppFab />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([buildOrganizationJsonLd(t("meta.description")), buildFaqJsonLd(tFaq as (key: string) => string)]) }}
      />
    </div>
  );
}
