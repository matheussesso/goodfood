import {
  BellRing,
  Calculator,
  Dog,
  Droplets,
  Link2,
  PackageCheck,
  Pill,
  Scale,
  ShoppingBag,
  ShoppingBasket,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** An item whose copy lives under `Landing.<section>.<id>` in the messages. */
export interface IconItem<Id extends string = string> {
  id: Id;
  icon: LucideIcon;
}

/** Anchors of the page sections, in page order, with the matching nav label key. */
export const NAV_ITEMS = [
  { anchor: "como-funciona", labelKey: "how" },
  { anchor: "sistema", labelKey: "system" },
  { anchor: "sobre", labelKey: "about" },
  { anchor: "duvidas", labelKey: "faq" },
] as const;

/** Production steps shown as a compact strip in the About section. */
export const PROCESS_STEPS: IconItem[] = [
  { id: "select", icon: ShoppingBasket },
  { id: "prepare", icon: Droplets },
  { id: "supplement", icon: Pill },
  { id: "portion", icon: Scale },
  { id: "delivery", icon: Truck },
];

export const HOW_STEPS: IconItem[] = [
  { id: "pet", icon: Dog },
  { id: "recipe", icon: UtensilsCrossed },
  { id: "link", icon: Link2 },
  { id: "order", icon: ShoppingBag },
];

export const SYSTEM_FEATURES: IconItem[] = [
  { id: "pet", icon: Dog },
  { id: "alerts", icon: BellRing },
  { id: "recipe", icon: Calculator },
  { id: "order", icon: PackageCheck },
];

/** Ids of the FAQ entries (`Landing.faq.items.<id>`), in display order. */
export const FAQ_IDS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
