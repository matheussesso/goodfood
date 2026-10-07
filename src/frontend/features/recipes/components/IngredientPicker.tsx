"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CheckCircle2, Info, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Ingredient } from "@/hooks/useIngredients";
import type { RecipeCostBreakdownLine } from "@/hooks/useRecipes";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DraftIngredient } from "@/features/recipes/useRecipeCostSimulation";

interface IngredientPickerProps {
  /** Full ingredient catalog to choose from. */
  catalog: Ingredient[];
  /** Currently selected rows (quantity per day). */
  value: DraftIngredient[];
  onChange: (next: DraftIngredient[]) => void;
  /** Base-cost lines from the live simulation, to show each row's cost. */
  baseCostLines?: RecipeCostBreakdownLine[];
  /** Validation message shown under the list. */
  error?: string;
}

/** Sentinel for "no category filter". */
const ALL_CATEGORIES = "all";

/**
 * Searchable ingredient grid plus the list of selected ingredients with their
 * per-day quantities. Controlled: the parent owns the selection.
 *
 * @param catalog - Available ingredients.
 * @param value - Selected rows.
 * @param onChange - Called with the new selection.
 * @param baseCostLines - Optional per-ingredient cost lines from the simulation.
 * @param error - Optional validation message.
 */
export function IngredientPicker({ catalog, value, onChange, baseCostLines = [], error }: IngredientPickerProps) {
  const t = useTranslations("Catalog");
  const tRec = useTranslations("Recipes");
  const tCommon = useTranslations("Common");
  const tAdmin = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const categories = Array.from(new Set(catalog.map((ingredient) => ingredient.category).filter(Boolean))) as string[];
  const visible = catalog
    .filter((ingredient) => {
      const matchesSearch = ingredient.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === ALL_CATEGORIES || ingredient.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const costByName = new Map(baseCostLines.map((line) => [line.name, line]));

  function toggle(ingredient: Ingredient) {
    const selected = value.some((item) => item.id === ingredient.id);
    onChange(selected ? value.filter((item) => item.id !== ingredient.id) : [...value, { id: ingredient.id, quantity: "", unit: ingredient.unit }]);
  }

  function setQuantity(index: number, raw: string) {
    const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".").replace(/^(\d*\.?\d*).*/, "$1");
    onChange(value.map((item, i) => (i === index ? { ...item, quantity: cleaned } : item)));
  }

  /** While focused show the raw text (so "0." survives); otherwise a tidy number. */
  function displayQuantity(item: DraftIngredient, focused: boolean): string {
    const raw = String(item.quantity);
    if (focused) {
      if (raw.endsWith(".") || raw.endsWith(",")) return raw;
      const parsed = parseFloat(raw.replace(",", "."));
      return Number.isNaN(parsed) || parsed === 0 ? "" : String(parsed);
    }
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed === 0) return raw;
    return parsed.toLocaleString("pt-BR", { maximumFractionDigits: 3, useGrouping: false });
  }

  return (
    <div className="space-y-3">
      <Label>{tRec("ingredients")}</Label>
      <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-2.5 rounded-lg flex gap-2">
        <Info className="w-4 h-4 shrink-0" />
        <span>{tRec("important_daily_qty")}</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("search_ingredient")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={tCommon("category")}
          className="h-9 px-2 border rounded-md text-sm bg-background border-input w-36"
        >
          <option value={ALL_CATEGORIES}>{tCommon("all")}</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1 border rounded-md p-2 bg-muted/20">
        {visible.map((ingredient) => {
          const selected = value.some((item) => item.id === ingredient.id);
          return (
            <button
              type="button"
              key={ingredient.id}
              onClick={() => toggle(ingredient)}
              aria-pressed={selected}
              className={cn(
                "border p-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between min-h-[56px] text-left",
                selected ? "border-primary bg-primary/10 shadow-sm" : "hover:border-primary/50 hover:bg-muted/50 bg-background"
              )}
            >
              <span className="flex justify-between items-start gap-1 w-full">
                <span className="font-semibold text-xs leading-tight line-clamp-2">{ingredient.name}</span>
                {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground truncate mt-1">
                {ingredient.category || t("general")}
              </span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center text-xs text-muted-foreground py-4">{t("no_ingredients_found")}</div>
        )}
      </div>

      {value.length > 0 ? (
        <div className="border rounded-md p-3 bg-card space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1.5 border-b">
            {tAdmin("selected_ingredients_daily")}
          </p>
          {value.map((item, index) => {
            const ingredient = catalog.find((candidate) => candidate.id === item.id);
            const cost = ingredient ? costByName.get(ingredient.name) : undefined;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-2.5 py-2 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="flex-1 text-sm font-medium truncate min-w-0">{ingredient?.name ?? "?"}</span>
                {cost && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">R$ {formatBRL(cost.total_cost)}</span>
                )}
                <div className="flex items-center rounded-md border overflow-hidden shrink-0 bg-background">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    aria-label={`${ingredient?.name ?? ""} ${tRec("qty_per_day")}`}
                    className="w-24 px-2 py-1.5 text-sm text-right border-0 focus:outline-none focus:ring-0 bg-background"
                    value={displayQuantity(item, editingIndex === index)}
                    onFocus={() => setEditingIndex(index)}
                    onBlur={() => setEditingIndex(null)}
                    onChange={(e) => setQuantity(index, e.target.value)}
                  />
                  <span className="px-2 py-1.5 bg-muted text-xs font-medium text-muted-foreground border-l shrink-0">{item.unit}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={tCommon("delete")}
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">{t("no_ingredients")}</p>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
