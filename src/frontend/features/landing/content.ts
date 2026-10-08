import { BellRing, Calculator, Dog, PackageCheck, type LucideIcon } from "lucide-react";

/** Anchors of the page sections, in page order, with the matching nav label key. */
export const NAV_ITEMS = [
  { anchor: "como-funciona", labelKey: "how" },
  { anchor: "sistema", labelKey: "system" },
  { anchor: "sobre", labelKey: "about" },
  { anchor: "duvidas", labelKey: "faq" },
] as const;

/** Ids of the production steps (`Landing.process.steps.<id>`), in order. */
export const PROCESS_STEP_IDS = ["select", "prepare", "supplement", "portion", "delivery"] as const;

/** Ids of the ordering steps (`Landing.how.steps.<id>`), in order. */
export const HOW_STEP_IDS = ["pet", "recipe", "link", "order"] as const;

/** A system feature shown in the tabbed showcase (`Landing.system.features.<id>`). */
export interface SystemFeature {
  id: "pet" | "alerts" | "recipe" | "order";
  icon: LucideIcon;
}

export const SYSTEM_FEATURES: SystemFeature[] = [
  { id: "recipe", icon: Calculator },
  { id: "pet", icon: Dog },
  { id: "order", icon: PackageCheck },
  { id: "alerts", icon: BellRing },
];

/** Ids of the FAQ entries (`Landing.faq.items.<id>`), in display order. */
export const FAQ_IDS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

/** Ingredients of the interactive hero label (`Landing.hero.label.ingredients.<id>`) with grams per meal. */
export const LABEL_INGREDIENTS = [
  { id: "chicken", grams: 180 },
  { id: "pumpkin", grams: 90 },
  { id: "rice", grams: 70 },
  { id: "liver", grams: 30 },
  { id: "carrot", grams: 50 },
  { id: "spinach", grams: 25 },
] as const;

export type LabelIngredientId = (typeof LABEL_INGREDIENTS)[number]["id"];

/** Ingredients selected when the page loads. */
export const DEFAULT_LABEL_SELECTION: LabelIngredientId[] = ["chicken", "pumpkin", "rice", "liver"];
