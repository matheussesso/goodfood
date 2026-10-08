import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { FAQ_IDS } from "@/features/landing/content";
import { SectionHeading } from "./SectionHeading";

/** Frequently asked questions, expandable with native `<details>` (no JavaScript). */
export async function Faq() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.faq" });

  return (
    <section id="duvidas" aria-labelledby="faq-title" className="scroll-mt-16 bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading id="faq-title" title={t("title")} />

        <div className="border-b border-gf-ink/15">
          {FAQ_IDS.map((id) => (
            <details key={id} className="group border-t border-gf-ink/15">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-lg font-bold text-gf-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gf-red [&::-webkit-details-marker]:hidden">
                {t(`items.${id}.q`)}
                <Plus className="h-6 w-6 shrink-0 text-gf-red transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <p className="max-w-xl pb-6 text-base leading-relaxed text-gf-ink/70">{t(`items.${id}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
