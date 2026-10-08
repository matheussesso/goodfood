import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { FAQ_IDS } from "@/features/landing/content";
import { SectionHeading } from "./SectionHeading";

/** Frequently asked questions, expandable with native `<details>` (no JavaScript). */
export async function Faq() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.faq" });

  return (
    <section id="duvidas" aria-labelledby="faq-title" className="scroll-mt-24 bg-gf-cream py-16 sm:py-24">
      <div className="mx-auto max-w-3xl space-y-12 px-4 sm:px-6">
        <SectionHeading id="faq-title" eyebrow={t("eyebrow")} title={t("title")} />

        <div className="space-y-3">
          {FAQ_IDS.map((id) => (
            <details key={id} className="group rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow open:shadow-lg open:shadow-black/5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-4 text-left text-base font-semibold text-gf-ink [&::-webkit-details-marker]:hidden">
                {t(`items.${id}.q`)}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gf-rose text-gf-red transition-transform group-open:rotate-45 motion-reduce:transition-none">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="px-6 pb-6 text-base leading-relaxed text-gf-ink/70">{t(`items.${id}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
