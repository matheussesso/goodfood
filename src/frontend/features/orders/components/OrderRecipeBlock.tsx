import { useTranslations } from "next-intl";
import { Cat, Dog, ExternalLink, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import type { OrderItem } from "@/hooks/useOrders";
import { formatQuantity, recipeDailyKg, weightQuantity } from "@/features/recipes/recipe-facts";
import { CompositionBar } from "@/features/recipes/components/RecipeFacts";

/**
 * Compact recipe line for an order's items accordion (card and list views):
 * pet, plan duration, total weight and a composition bar.
 *
 * @param item - The order item to render.
 * @param href - Where the recipe name links to (plain text when null).
 */
export function OrderRecipeBlock({ item, href }: { item: OrderItem; href: string | null }) {
  const t = useTranslations("Orders");
  const tRec = useTranslations("Recipes");
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
  const dailyKg = item.recipe ? recipeDailyKg(item.recipe) : 0;

  return (
    <div className="flex items-start gap-2 py-1.5 first:pt-0">
      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <UtensilsCrossed className="w-3 h-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        {href ? (
          <Link
            href={href}
            className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 flex items-center gap-1 group"
          >
            {item.recipe?.name ?? `#${item.recipe_id}`}
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 shrink-0" />
          </Link>
        ) : (
          <p className="text-xs font-semibold text-foreground line-clamp-1">{item.recipe?.name ?? `#${item.recipe_id}`}</p>
        )}
        <p className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-1 mt-0.5">
          {item.pet && (
            <>
              <PetIcon className="w-3 h-3" aria-hidden="true" /> {item.pet.name} <span aria-hidden="true">·</span>
            </>
          )}
          {t("days_value", { count: item.duration_days })}
          {dailyKg > 0 && (
            <>
              <span aria-hidden="true">·</span>
              {formatQuantity(weightQuantity(dailyKg * item.duration_days), tRec("unit_each"))}
            </>
          )}
        </p>
        {item.recipe && (
          <div className="mt-1.5">
            <CompositionBar recipe={item.recipe} showLegend={false} />
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
        R$ {formatBRL(item.unit_price)}
      </span>
    </div>
  );
}
