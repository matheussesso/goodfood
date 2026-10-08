/**
 * Public company data used by the landing page (contacts, links, SEO).
 * Values can be overridden per environment through `NEXT_PUBLIC_*` variables.
 */

/** Digits only, with country code, as expected by `wa.me`. */
const DEFAULT_WHATSAPP = "5561981425385";

const whatsappDigits = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_WHATSAPP).replace(/\D/g, "");

export const company = {
  name: "Good Food Pet",
  city: "Brasília",
  region: "DF",
  /** Public origin of the site, without trailing slash. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  whatsappDigits,
  /** Human-readable phone, e.g. "(61) 98142-5385". */
  whatsappLabel: formatBrazilianPhone(whatsappDigits),
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "goodfood.pet",
  linktreeUrl: process.env.NEXT_PUBLIC_LINKTREE_URL ?? "https://linktr.ee/goodfood.pet",
} as const;

/** Instagram profile URL. */
export const instagramUrl = `https://www.instagram.com/${company.instagramHandle}/`;

/**
 * Builds a WhatsApp deep link.
 *
 * @param message - Optional pre-filled message.
 * @returns A `https://wa.me/...` URL.
 */
export function getWhatsappUrl(message?: string): string {
  const base = `https://wa.me/${company.whatsappDigits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Formats a Brazilian number (with or without the 55 country code) as "(DD) 9XXXX-XXXX".
 *
 * @param digits - Phone digits.
 * @returns The formatted phone, or the digits unchanged when the length is unexpected.
 */
export function formatBrazilianPhone(digits: string): string {
  const national = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(national);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits;
}
