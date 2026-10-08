import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { SYSTEM_FEATURES } from "@/features/landing/content";
import { AlertsMock, OrderMock, PetMock, RecipeMock } from "./mockups";
import { SectionHeading } from "./SectionHeading";

/** Highlights what the system does, each feature next to an illustrative mock screen. */
export async function SystemShowcase() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.system" });

  const mocks: Record<string, ReactNode> = {
    pet: (
      <PetMock
        title={t("features.pet.title")}
        name={t("features.pet.mock_name")}
        meta={t("features.pet.mock_meta")}
        vaccine={t("features.pet.mock_vaccine")}
        restriction={t("features.pet.mock_restriction")}
      />
    ),
    recipe: <RecipeMock title={t("features.recipe.mock_title")} totalLabel={t("features.recipe.mock_total")} />,
    order: (
      <OrderMock
        title={t("features.order.mock_title")}
        currentIndex={1}
        steps={[
          t("features.order.mock_steps.payment"),
          t("features.order.mock_steps.production"),
          t("features.order.mock_steps.delivery"),
          t("features.order.mock_steps.done"),
        ]}
      />
    ),
    alerts: (
      <AlertsMock
        title={t("features.alerts.mock_title")}
        invoice={t("features.alerts.mock_items.invoice")}
        vaccine={t("features.alerts.mock_items.vaccine")}
        incomplete={t("features.alerts.mock_items.incomplete")}
      />
    ),
  };

  return (
    <section id="sistema" aria-labelledby="system-title" className="gf-paws-soft scroll-mt-24 bg-gf-cream py-16 sm:py-24">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <SectionHeading id="system-title" eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="grid gap-5 md:grid-cols-2">
          {SYSTEM_FEATURES.map(({ id, icon: Icon }) => (
            <article key={id} className="flex flex-col gap-5 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gf-red/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gf-red text-white shadow-lg shadow-gf-red/30">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="gf-display text-xl font-extrabold text-gf-ink">{t(`features.${id}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gf-ink/65">{t(`features.${id}.desc`)}</p>
                </div>
              </div>
              {mocks[id] && (
                <div className="mt-auto rounded-3xl bg-gf-cream p-4" aria-hidden="true">
                  {mocks[id]}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
