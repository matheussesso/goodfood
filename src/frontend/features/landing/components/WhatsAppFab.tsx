import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { getWhatsappUrl } from "@/lib/company";

/** Floating WhatsApp shortcut, always reachable on mobile and desktop. */
export async function WhatsAppFab() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });

  return (
    <a
      href={getWhatsappUrl(t("whatsapp_message"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("a11y.whatsapp_fab")}
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366] motion-reduce:transition-none"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
