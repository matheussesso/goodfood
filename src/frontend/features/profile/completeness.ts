/** Account fields that count towards the completeness meter. */
export type CompletenessKey = "contact" | "address" | "pet";

/** One checklist row of the completeness meter. */
export interface CompletenessItem {
  key: CompletenessKey;
  done: boolean;
  /** Profile section (or route) where the item can be completed. */
  href: string;
}

/** Result of {@link getCompleteness}. */
export interface Completeness {
  items: CompletenessItem[];
  doneCount: number;
  percent: number;
  isComplete: boolean;
}

interface CompletenessInput {
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  /** Number of pets, or undefined while the dashboard summary is still loading. */
  petsCount?: number;
}

/**
 * Computes how complete a customer account is: contact phone, delivery address and first pet.
 *
 * @param input - Profile fields plus the pet count from the dashboard summary.
 * @returns Checklist items, done count and rounded percentage.
 */
export function getCompleteness({ phone, street, city, petsCount }: CompletenessInput): Completeness {
  const items: CompletenessItem[] = [
    { key: "contact", done: !!phone?.replace(/\D/g, ""), href: "/profile?section=personal" },
    { key: "address", done: !!(street && city), href: "/profile?section=address" },
    { key: "pet", done: (petsCount ?? 0) > 0, href: "/pets/new" },
  ];
  const doneCount = items.filter((item) => item.done).length;

  return {
    items,
    doneCount,
    percent: Math.round((doneCount / items.length) * 100),
    isComplete: doneCount === items.length,
  };
}
