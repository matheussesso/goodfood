import { getTranslations } from "next-intl/server";
import { Bone, Check, CalendarClock, MessageCircle, ShoppingBag } from "lucide-react";
import { getWhatsappUrl } from "@/lib/company";
import { SectionHeading } from "./SectionHeading";

const POINT_IDS = ["a", "b", "c"] as const;

/** One-off orders vs subscriptions, plus a slim line for the bone broth (ordered via WhatsApp). */
export async function Plans() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });

  const cards = [
    { id: "single", icon: ShoppingBag, featured: false },
    { id: "subscription", icon: CalendarClock, featured: true },
  ] as const;

  return (
    <section aria-labelledby="plans-title" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
        <SectionHeading id="plans-title" eyebrow={t("plans.eyebrow")} title={t("plans.title")} subtitle={t("plans.subtitle")} />

        <div className="grid gap-5 md:grid-cols-2">
          {cards.map(({ id, icon: Icon, featured }) => (
            <article
              key={id}
              className={`relative rounded-[2rem] p-7 ${
                featured
                  ? "bg-linear-to-br from-gf-red to-gf-red-dark text-white shadow-2xl shadow-gf-red/30"
                  : "bg-white text-gf-ink shadow-sm ring-1 ring-black/10"
              }`}
            >
              {featured && (
                <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-bold text-gf-red">{t("plans.subscription.badge")}</span>
              )}
              <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? "bg-white/20" : "bg-gf-rose text-gf-red"}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="gf-display text-xl font-extrabold">{t(`plans.${id}.title`)}</h3>
              <p className={`mt-1 text-sm ${featured ? "text-white/85" : "text-gf-ink/65"}`}>{t(`plans.${id}.desc`)}</p>
              <ul className="mt-5 space-y-2.5">
                {POINT_IDS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm font-medium">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${featured ? "bg-white/25" : "bg-gf-rose text-gf-red"}`}>
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {t(`plans.${id}.points.${point}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-3xl bg-gf-cream px-6 py-4 ring-1 ring-gf-red/10 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gf-red text-white">
            <Bone className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="flex-1 text-sm text-gf-ink/80">
            <strong className="font-bold text-gf-ink">{t("broth.title")}.</strong> {t("broth.desc")}
          </p>
          <a
            href={getWhatsappUrl(`${t("whatsapp_message")} (${t("broth.title")})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-gf-red shadow-sm ring-1 ring-gf-red/20 transition-colors hover:bg-gf-rose"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> {t("cta.whatsapp")}
          </a>
        </div>
      </div>
    </section>
  );
}
