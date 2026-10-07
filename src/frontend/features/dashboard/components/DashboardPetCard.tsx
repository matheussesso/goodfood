"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Cat, Dog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { DashboardPet } from "@/hooks/useDashboard";

/**
 * A pet with the recipes linked to it and the most useful next action: order
 * when it already has a recipe, otherwise create one for it.
 *
 * @param pet - Compact pet data from the dashboard summary.
 */
export function DashboardPetCard({ pet }: { pet: DashboardPet }) {
  const t = useTranslations("Dashboard");
  const tOnboarding = useTranslations("Onboarding");
  const PetIcon = pet.type === "cat" ? Cat : Dog;
  const hasRecipes = pet.recipes.length > 0;

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {pet.photo_url ? (
          <Image src={pet.photo_url} alt={pet.name} width={48} height={48} className="h-12 w-12 shrink-0 rounded-full border object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PetIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <Link href={`/pets/${pet.id}`} className="block truncate font-semibold hover:text-primary">
            {pet.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{pet.breed || t("pet_recipes_count", { count: pet.recipes.length })}</p>
        </div>
      </div>

      <div className="min-h-[2.25rem] space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t("pet_recipes_count", { count: pet.recipes.length })}</p>
        {hasRecipes && (
          <p className="line-clamp-1 text-xs text-foreground">{pet.recipes.map((recipe) => recipe.name).join(" · ")}</p>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        {hasRecipes ? (
          <Link href="/orders/new" className="flex-1">
            <Button size="sm" className="w-full">
              {t("order_for_pet")}
            </Button>
          </Link>
        ) : (
          <Link href={`/recipes/new?pet_id=${pet.id}`} className="flex-1">
            <Button size="sm" className="w-full">
              {tOnboarding("create_recipe_for_pet", { name: pet.name })}
            </Button>
          </Link>
        )}
        <Link href={`/pets/${pet.id}`}>
          <Button size="sm" variant="outline">
            {t("view_pet")}
          </Button>
        </Link>
      </div>
    </li>
  );
}
