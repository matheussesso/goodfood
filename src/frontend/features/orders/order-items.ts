import type { OrderItem } from "@/hooks/useOrders";

/** Where an order item sits in its pet's meal plan (days are 1-based, inclusive). */
export interface OrderItemDayRange {
  startDay: number;
  endDay: number;
}

/**
 * Lays each pet's order items out on consecutive day ranges, following the
 * plan `position` (items without a pet form their own sequence).
 *
 * @param items - Every item of an order.
 * @returns The day range of each item, by item id.
 */
export function orderItemDayRanges(items: OrderItem[]): Record<number, OrderItemDayRange> {
  const ranges: Record<number, OrderItemDayRange> = {};
  const nextDay = new Map<number | undefined, number>();

  [...items]
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .forEach((item) => {
      const startDay = nextDay.get(item.pet_id) ?? 1;
      ranges[item.id] = { startDay, endDay: startDay + item.duration_days - 1 };
      nextDay.set(item.pet_id, startDay + item.duration_days);
    });

  return ranges;
}

/**
 * Link to the recipe of an order item. Recipes live inside their pet, so the
 * customer goes to the pet's recipes tab and an admin to the customer's pet page.
 *
 * @param item - The order item.
 * @param scope - Which area of the app is linking.
 * @returns The path, or null when the item has no pet to link to.
 */
export function orderItemRecipeHref(item: OrderItem, scope: "customer" | "admin"): string | null {
  if (!item.pet_id) return null;
  if (scope === "customer") return `/pets/${item.pet_id}?tab=recipes`;
  return item.pet?.user_id ? `/admin/customers/${item.pet.user_id}/pets/${item.pet_id}` : null;
}
