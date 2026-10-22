"use client";

import { useTranslations } from "next-intl";
import { CalendarRange, Cat, Clock, Dog, ExternalLink, Layers, Salad, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import type { OrderItem } from "@/hooks/useOrders";
import type { OrderItemDayRange } from "../order-items";

interface OrderItemDetailProps {
  item: OrderItem;
  /** Where the item sits in its pet's meal plan. */
  range?: OrderItemDayRange;
  /** Link to the recipe; the header is not a link when null. */
  href?: string | null;
}

/**
 * Expanded recipe block for the order detail pages: recipe name, pet, the
 * plan duration and day range, stat chips and ingredient tags.
 *
 * @param item - The order item to display.
 * @param range - Day range of the item in its pet's plan.
 * @param href - Where the recipe name links to.
 */
export function OrderItemDetail({ item, range, href }: OrderItemDetailProps) {
  const tCat = useTranslations("Catalog");
  const tOrders = useTranslations("Orders");
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
  const ingredients = item.recipe?.ingredients ?? [];
  const headerClass = "flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group border-b";

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      {href ? (
        <Link href={href} className={headerClass}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors break-words">
              {item.recipe?.name ?? `${tOrders("recipe")} #${item.recipe_id}`}
            </p>
            {item.pet && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <PetIcon className="w-3 h-3" /> {item.pet.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            R$ {formatBRL(item.unit_price)}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        </Link>
      ) : (
        <div className={headerClass}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors break-words">
              {item.recipe?.name ?? `${tOrders("recipe")} #${item.recipe_id}`}
            </p>
            {item.pet && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <PetIcon className="w-3 h-3" /> {item.pet.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            R$ {formatBRL(item.unit_price)}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        </div>
      )}

      <div className="px-4 py-3 space-y-3">
        {item.recipe && (
          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {tOrders("days_value", { count: item.duration_days })}
            </span>
            {range && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <CalendarRange className="w-3 h-3" />
                {tOrders("plan_days_range", { start: range.startDay, end: range.endDay })}
              </span>
            )}
            {item.recipe.daily_portions && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <Salad className="w-3 h-3" />
                {item.recipe.daily_portions} {tCat("daily_portions").toLowerCase()}
              </span>
            )}
            {ingredients.length > 0 && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <Layers className="w-3 h-3" />
                {ingredients.length} {tCat("ingredients").toLowerCase()}
              </span>
            )}
          </div>
        )}

        {ingredients.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {tCat("composition")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map((ingredient) => (
                <span key={ingredient.id} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                  {ingredient.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
