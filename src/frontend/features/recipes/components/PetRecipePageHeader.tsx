"use client";

import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface PetRecipePageHeaderProps {
  petId: string;
  title: string;
  subtitle?: string;
  backLabel: string;
}

/**
 * Header of the recipe pages that live inside a pet: back link to the pet's
 * recipes, title and subtitle.
 *
 * @param petId - Pet the recipe belongs to.
 * @param title - Page title.
 * @param subtitle - Supporting line.
 * @param backLabel - Accessible label of the back link.
 */
export function PetRecipePageHeader({ petId, title, subtitle, backLabel }: PetRecipePageHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Link
        href={`/pets/${petId}?tab=recipes`}
        aria-label={backLabel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
      <div className="min-w-0">
        <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          <UtensilsCrossed className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <span className="break-words">{title}</span>
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
