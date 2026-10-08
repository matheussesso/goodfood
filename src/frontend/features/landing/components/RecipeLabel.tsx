"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LABEL_SELECTION,
  LABEL_INGREDIENTS,
  type LabelIngredientId,
} from "@/features/landing/content";

export interface RecipeLabelCopy {
  title: string;
  meta: string;
  hint: string;
  total: string;
  note: string;
  empty: string;
  logoAlt: string;
  ingredients: Record<LabelIngredientId, string>;
}

const MAX_GRAMS = Math.max(...LABEL_INGREDIENTS.map((item) => item.grams));

/**
 * Interactive illustration of the system's recipe builder, drawn as the label
 * of a meal container: visitors toggle ingredients and the list and total
 * update. It runs on made-up data and shows no prices.
 *
 * @param copy - Translated texts and ingredient names.
 */
export function RecipeLabel({ copy }: { copy: RecipeLabelCopy }) {
  const [selected, setSelected] = useState<LabelIngredientId[]>(DEFAULT_LABEL_SELECTION);

  const toggle = (id: LabelIngredientId) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const chosen = LABEL_INGREDIENTS.filter((item) => selected.includes(item.id));
  const total = chosen.reduce((sum, item) => sum + item.grams, 0);

  return (
    <div className="gf-settle relative w-full max-w-sm rounded-[1.75rem] bg-white p-6 text-gf-ink shadow-2xl shadow-black/25 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="gf-display text-2xl font-extrabold leading-tight">{copy.title}</h3>
          <p className="mt-0.5 text-sm text-gf-ink/60">{copy.meta}</p>
        </div>
        <Image src="/goodfood-logo.png" alt={copy.logoAlt} width={864} height={209} className="mt-1 h-6 w-auto shrink-0" />
      </div>

      <ul className="mt-5 min-h-[9.5rem] space-y-3.5" aria-live="polite">
        {chosen.length === 0 && <li className="py-6 text-sm text-gf-ink/60">{copy.empty}</li>}
        {chosen.map(({ id, grams }) => (
          <li key={id}>
            <div className="flex items-baseline justify-between text-sm font-semibold">
              <span>{copy.ingredients[id]}</span>
              <span className="tabular-nums text-gf-ink/55">{grams} g</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-gf-ink/10">
              <div className="gf-fill h-full rounded-full bg-gf-red transition-[width] duration-300" style={{ width: `${(grams / MAX_GRAMS) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      {/* Tear-off line with the two "punched" notches of a ticket stub. */}
      <div className="relative my-5 border-t-2 border-dashed border-gf-ink/20">
        <span className="absolute -left-[2.15rem] -top-3 h-6 w-6 rounded-full bg-gf-red sm:-left-[2.4rem]" aria-hidden="true" />
        <span className="absolute -right-[2.15rem] -top-3 h-6 w-6 rounded-full bg-gf-red sm:-right-[2.4rem]" aria-hidden="true" />
      </div>

      <p className="text-xs font-medium text-gf-ink/60">{copy.hint}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {LABEL_INGREDIENTS.map(({ id }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(id)}
              className={cn(
                "min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gf-red",
                active ? "bg-gf-ink text-white" : "bg-white text-gf-ink ring-1 ring-gf-ink/25 hover:ring-gf-ink/60"
              )}
            >
              {copy.ingredients[id]}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-gf-ink/10 pt-4">
        <p className="text-sm font-semibold">{copy.total}</p>
        <p className="gf-display text-4xl font-extrabold leading-none tabular-nums" aria-live="polite">
          {total} <span className="text-xl">g</span>
        </p>
      </div>
      <p className="mt-2 text-xs text-gf-ink/55">{copy.note}</p>
    </div>
  );
}
