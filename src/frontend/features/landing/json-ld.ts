import { FAQ_IDS } from "@/features/landing/content";
import { company, instagramUrl } from "@/lib/company";

type Translate = (key: string) => string;

/**
 * Schema.org `Organization` data for search engines.
 *
 * @param description - Short description of the company.
 */
export function buildOrganizationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.siteUrl,
    logo: `${company.siteUrl}/goodfood-logo.png`,
    description,
    telephone: `+${company.whatsappDigits}`,
    address: { "@type": "PostalAddress", addressLocality: company.city, addressRegion: company.region, addressCountry: "BR" },
    sameAs: [instagramUrl, company.linktreeUrl],
  };
}

/**
 * Schema.org `FAQPage` data built from the FAQ messages.
 *
 * @param t - Translator scoped to `Landing.faq.items`.
 */
export function buildFaqJsonLd(t: Translate) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_IDS.map((id) => ({
      "@type": "Question",
      name: t(`${id}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`${id}.a`) },
    })),
  };
}

/**
 * Serializes JSON-LD for an inline `<script>`, escaping `<` so content can never close the tag.
 *
 * @param data - JSON-serializable structured data.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
