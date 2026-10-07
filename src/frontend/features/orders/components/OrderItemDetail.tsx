"use client";

import { useTranslations } from "next-intl";
import { Cat, Clock, Dog, ExternalLink, Layers, Salad, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import type { OrderItem } from "@/hooks/useOrders";

/**
 * Expanded recipe block for the order detail pages: linked recipe name, pet,
 * stat chips and ingredient tags.
 *
 * @param item - The order item to display.
 */
export function OrderItemDetail({ item }: { item: OrderItem }) {
  const tCat = useTranslations("Catalog");
  const tOrders = useTranslations("Orders");
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
  const ingredients = item.recipe?.ingredients ?? [];

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <Link
        href={`/recipes/${item.recipe_id}`}
        className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group border-b"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
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

      <div className="px-4 py-3 space-y-3">
        {item.recipe && (
          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
            {item.recipe.duration_days && (
              <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {item.recipe.duration_days} {tCat("days")}
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
