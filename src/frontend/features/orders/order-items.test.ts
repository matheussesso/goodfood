import { describe, expect, it } from "vitest";
import type { OrderItem } from "@/hooks/useOrders";
import type { Pet } from "@/hooks/usePets";
import { orderItemDayRanges, orderItemRecipeHref } from "./order-items";

const item = (id: number, petId: number | undefined, position: number, days: number): OrderItem =>
  ({ id, order_id: 1, pet_id: petId, recipe_id: id * 10, duration_days: days, position, unit_price: 0, quantity: 1 }) as OrderItem;

describe("orderItemDayRanges", () => {
  it("chains each pet's items by position, independently per pet", () => {
    const ranges = orderItemDayRanges([item(3, 1, 2, 30), item(1, 1, 1, 15), item(2, 2, 1, 7)]);
    expect(ranges[1]).toEqual({ startDay: 1, endDay: 15 });
    expect(ranges[3]).toEqual({ startDay: 16, endDay: 45 });
    expect(ranges[2]).toEqual({ startDay: 1, endDay: 7 });
  });
});

describe("orderItemRecipeHref", () => {
  it("links customers to the pet's recipes and admins to the customer's pet", () => {
    const withPet = { ...item(1, 4, 1, 15), pet: { id: 4, user_id: 9 } as Pet };
    expect(orderItemRecipeHref(withPet, "customer")).toBe("/pets/4?tab=recipes");
    expect(orderItemRecipeHref(withPet, "admin")).toBe("/admin/customers/9/pets/4");
  });

  it("returns null without a pet", () => {
    expect(orderItemRecipeHref(item(1, undefined, 1, 15), "customer")).toBeNull();
  });
});
