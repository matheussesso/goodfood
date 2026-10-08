import { getTranslations } from "next-intl/server";
import { SYSTEM_FEATURES } from "@/features/landing/content";
import { FeatureTabs, type FeatureTabItem } from "./FeatureTabs";
import { AlertsMock, OrderMock, PetMock, RecipeMock } from "./mockups";
import { SectionHeading } from "./SectionHeading";

/** Dark section where each system feature is paired with an illustrative screen. */
export async function SystemShowcase() {
  const t = await getTranslations({ locale: "pt", namespace: "Landing.system" });
  const tA11y = await getTranslations({ locale: "pt", namespace: "Landing.a11y" });

  const panels = {
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

  const items: FeatureTabItem[] = SYSTEM_FEATURES.map(({ id, icon: Icon }) => ({
    id,
    icon: <Icon className="h-6 w-6 shrink-0" />,
    title: t(`features.${id}.title`),
    description: t(`features.${id}.desc`),
    panel: panels[id],
  }));

  return (
    <section id="sistema" aria-labelledby="system-title" className="scroll-mt-16 bg-gf-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6">
        <SectionHeading id="system-title" invert title={t("title")} subtitle={t("subtitle")} />
        <FeatureTabs items={items} label={tA11y("features_tabs")} />
      </div>
    </section>
  );
}
