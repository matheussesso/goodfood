import { Cat, Dog, ExternalLink, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import type { OrderItem } from "@/hooks/useOrders";

/**
 * Compact recipe line for an order's items accordion (card and list views).
 *
 * @param item - The order item to render.
 */
export function OrderRecipeBlock({ item }: { item: OrderItem }) {
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;

  return (
    <div className="flex items-start gap-2 py-1.5 first:pt-0">
      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <UtensilsCrossed className="w-3 h-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/recipes/${item.recipe_id}`}
          className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 flex items-center gap-1 group"
        >
          {item.recipe?.name ?? `#${item.recipe_id}`}
          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 shrink-0" />
        </Link>
        {item.pet && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <PetIcon className="w-3 h-3" /> {item.pet.name}
          </p>
        )}
      </div>
      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
        R$ {formatBRL(item.unit_price)}
      </span>
    </div>
  );
}
