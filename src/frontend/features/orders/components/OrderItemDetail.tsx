"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, Cat, Dog, ExternalLink, Scale, Utensils, UtensilsCrossed, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatBRL } from "@/lib/format";
import type { OrderItem } from "@/hooks/useOrders";
import { formatQuantity, recipeDailyKg, weightQuantity } from "@/features/recipes/recipe-facts";
import { CompositionBar, RecipeDetailsDisclosure, RecipeStatGrid } from "@/features/recipes/components/RecipeFacts";
import type { OrderItemDayRange } from "../order-items";

interface OrderItemDetailProps {
  item: OrderItem;
  /** Where the item sits in its pet's meal plan. */
  range?: OrderItemDayRange;
  /** Link to the recipe; the header is not a link when null. */
  href?: string | null;
  /** Whether the ingredient amounts and preparation start open. */
  defaultExpanded?: boolean;
}

/**
 * Recipe block for the order detail pages: recipe name, pet and plan days,
 * key figures for the item's duration (total weight, cost per day…),
 * composition by category and, on demand, the ingredient amounts for the
 * whole period and the preparation.
 *
 * @param item - The order item to display.
 * @param range - Day range of the item in its pet's plan.
 * @param href - Where the recipe name links to.
 * @param defaultExpanded - Whether the ingredient details start open.
 */
export function OrderItemDetail({ item, range, href, defaultExpanded = false }: OrderItemDetailProps) {
  const tOrders = useTranslations("Orders");
  const tRec = useTranslations("Recipes");
  const tCat = useTranslations("Catalog");
  const PetIcon = item.pet?.type === "cat" ? Cat : Dog;
  const recipe = item.recipe;
  const days = item.duration_days;
  const dailyKg = recipe ? recipeDailyKg(recipe) : 0;
  const unitLabel = tRec("unit_each");

  const header = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <UtensilsCrossed className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {recipe?.name ?? `${tOrders("recipe")} #${item.recipe_id}`}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
            {item.pet && (
              <span className="flex items-center gap-1">
                <PetIcon className="h-3 w-3" aria-hidden="true" /> {item.pet.name}
              </span>
            )}
            {item.pet && range && <span aria-hidden="true">·</span>}
            {range && <span>{tOrders("plan_days_range", { start: range.startDay, end: range.endDay })}</span>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-base font-bold text-amber-600 dark:text-amber-400">{formatBRL(item.unit_price, true)}</span>
        {href && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
      </div>
    </>
  );
  const headerClass = "group flex items-center justify-between gap-3 border-b px-4 py-3.5";

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {href ? (
        <Link href={href} className={`${headerClass} transition-colors hover:bg-muted/30`}>
          {header}
        </Link>
      ) : (
        <div className={headerClass}>{header}</div>
      )}

      <div className="space-y-3 px-4 py-3">
        {recipe?.description && <p className="line-clamp-3 text-sm text-muted-foreground">{recipe.description}</p>}

        <RecipeStatGrid
          stats={[
            { label: tCat("duration"), value: tOrders("days_value", { count: days }), icon: <CalendarDays className="h-3 w-3" aria-hidden="true" /> },
            { label: tRec("portions_per_day_caps"), value: recipe?.daily_portions ?? "—", icon: <Utensils className="h-3 w-3" aria-hidden="true" /> },
            {
              label: tRec("total_weight"),
              value: dailyKg > 0 ? formatQuantity(weightQuantity(dailyKg * days), unitLabel) : "—",
              icon: <Scale className="h-3 w-3" aria-hidden="true" />,
            },
            {
              label: tRec("cost_per_day"),
              value: days > 0 ? formatBRL(Number(item.unit_price) / days, true) : "—",
              icon: <Wallet className="h-3 w-3" aria-hidden="true" />,
              accent: true,
            },
          ]}
        />
        {dailyKg > 0 && (
          <p className="text-xs text-muted-foreground">
            {tRec("daily_weight_hint", { weight: formatQuantity(weightQuantity(dailyKg), unitLabel) })}
          </p>
        )}

        {recipe && (
          <>
            <CompositionBar recipe={recipe} />
            <RecipeDetailsDisclosure recipe={recipe} days={days} id={`order-item-${item.id}-details`} defaultOpen={defaultExpanded} withComposition={false} />
          </>
        )}
      </div>
    </div>
  );
}
