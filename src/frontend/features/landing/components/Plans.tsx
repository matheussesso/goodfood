import { getTranslations } from "next-intl/server";
import { Bone, Check } from "lucide-react";
import { getWhatsappUrl } from "@/lib/company";
import { SectionHeading } from "./SectionHeading";

const POINT_IDS = ["a", "b", "c"] as const;

/** One-off orders next to subscriptions as two halves of one panel, plus a line for the bone broth. */
export async function Plans() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing" });

  const options = [
    { id: "single", tone: "bg-gf-blush text-gf-ink", check: "text-gf-red", desc: "text-gf-ink/65" },
    { id: "subscription", tone: "bg-gf-red text-white", check: "text-white", desc: "text-white/85" },
  ] as const;

  return (
    <section aria-labelledby="plans-title" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="plans-title" title={t("plans.title")} subtitle={t("plans.subtitle")} />

        <div className="mt-12 grid overflow-hidden rounded-[2rem] md:grid-cols-2">
          {options.map(({ id, tone, check, desc }) => (
            <article key={id} className={`p-8 sm:p-10 ${tone}`}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="gf-display text-3xl font-extrabold">{t(`plans.${id}.title`)}</h3>
                {id === "subscription" && (
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-gf-red">{t("plans.subscription.badge")}</span>
                )}
              </div>
              <p className={`mt-2 text-lg ${desc}`}>{t(`plans.${id}.desc`)}</p>
              <ul className="mt-7 space-y-3.5">
                {POINT_IDS.map((point) => (
                  <li key={point} className="flex items-start gap-3 font-medium">
                    <Check className={`mt-1 h-5 w-5 shrink-0 ${check}`} strokeWidth={3} aria-hidden="true" />
                    {t(`plans.${id}.points.${point}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-gf-ink/80">
          <Bone className="h-5 w-5 text-gf-red" aria-hidden="true" />
          <span>
            <strong className="font-bold text-gf-ink">{t("broth.title")}.</strong> {t("broth.desc")}
          </span>
          <a
            href={getWhatsappUrl(`${t("whatsapp_message")} (${t("broth.title")})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-gf-red underline underline-offset-4 hover:text-gf-red-dark"
          >
            {t("cta.whatsapp")}
          </a>
        </p>
      </div>
    </section>
  );
}
