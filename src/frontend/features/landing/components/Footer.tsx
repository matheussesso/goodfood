import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link2, MapPin, MessageCircle } from "lucide-react";
import { company, getWhatsappUrl, instagramUrl } from "@/lib/company";
import { NAV_ITEMS } from "@/features/landing/content";
import { InstagramIcon } from "./InstagramIcon";

/** Brand, section links and contact channels. */
export async function Footer() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });
  const year = new Date().getFullYear();

  const contacts = [
    { href: getWhatsappUrl(t("whatsapp_message")), label: company.whatsappLabel, icon: MessageCircle },
    { href: instagramUrl, label: `@${company.instagramHandle}`, icon: InstagramIcon },
    { href: company.linktreeUrl, label: company.linktreeUrl.replace(/^https?:\/\//, ""), icon: Link2 },
  ];

  return (
    <footer className="bg-gf-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:px-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <Image src="/goodfood-logo.png" alt={t("a11y.logo_alt")} width={864} height={209} className="h-10 w-auto" />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">{t("footer.tagline")}</p>
          <p className="flex items-center gap-2 text-sm text-white/70">
            <MapPin className="h-4 w-4" aria-hidden="true" /> {t("footer.location")}
          </p>
        </div>

        <nav aria-label={t("footer.explore")}>
          <h2 className="mb-3 text-sm font-bold text-white">{t("footer.explore")}</h2>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.anchor}>
                <a href={`#${item.anchor}`} className="flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white">
                  {t(`nav.${item.labelKey}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">{t("footer.contact")}</h2>
          <ul className="space-y-1">
            {contacts.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 text-sm text-white/70 transition-colors hover:text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/50">{t("footer.rights", { year })}</p>
    </footer>
  );
}
