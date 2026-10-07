"use client";

import { useTranslations } from "next-intl";
import { Link2, PartyPopper, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface RecipeSavedScreenProps {
  recipeId: number;
  /** Whether the saved recipe is already linked to at least one pet. */
  linked: boolean;
  /** Where "my recipes" goes (e.g. the customer page when an admin created it). */
  recipesHref: string;
}

/**
 * Confirmation after saving a recipe, pointing at the one step that makes it
 * useful: order it when it is linked to a pet, otherwise link it first.
 *
 * @param recipeId - The saved recipe.
 * @param linked - Whether it is linked to a pet.
 * @param recipesHref - Destination of the secondary "my recipes" button.
 */
export function RecipeSavedScreen({ recipeId, linked, recipesHref }: RecipeSavedScreenProps) {
  const t = useTranslations("Recipes");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <PartyPopper className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("recipe_confirmed_title")}</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">{linked ? t("saved_linked") : t("saved_unlinked")}</p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {linked ? (
          <Link href="/orders/new">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="h-5 w-5" /> {t("make_order")}
            </Button>
          </Link>
        ) : (
          <Link href={`/recipes/${recipeId}/edit`}>
            <Button size="lg" className="gap-2">
              <Link2 className="h-5 w-5" /> {t("link_to_pet")}
            </Button>
          </Link>
        )}
        <Link href={recipesHref}>
          <Button size="lg" variant="outline" className="gap-2">
            <UtensilsCrossed className="h-5 w-5" /> {t("my_recipes")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
