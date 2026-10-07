import type { RecipeCostBreakdownLine } from "@/hooks/useRecipes";

/** Display order of the admin cost-breakdown (supplement) lines returned by the API. */
export const ADMIN_BREAKDOWN_ORDER = [
  "Custo de Insumos Adicional",
  "Repasse Produção (Cozinha)",
  "Repasse Logística",
  "Margem Reserva",
  "Custo GFP+MKT",
  "Fiscal/Tributário",
  "Agenda",
  "Cobrar",
  "Resultado (Lucro Mínimo)",
] as const;

/** Breakdown line names that get special emphasis in the UI. */
export const CHARGE_LINE = "Cobrar";
export const RESULT_LINE = "Resultado (Lucro Mínimo)";

/** `Catalog` translation key for each fixed breakdown line name. */
export const BREAKDOWN_LABEL_KEYS: Record<string, string> = {
  "Custo de Insumos Adicional": "additional_ingredient_cost",
  "Repasse Produção (Cozinha)": "production_transfer",
  "Repasse Logística": "logistics_transfer",
  "Margem Reserva": "reserve_margin",
  "Custo GFP+MKT": "gfp_mkt",
  "Fiscal/Tributário": "fiscal_tax",
  "Agenda": "schedule",
  "Cobrar": "charge",
  "Resultado (Lucro Mínimo)": "result",
};

/**
 * Sorts supplement lines in the canonical admin order; unknown names go last.
 *
 * @param lines - Supplement lines as returned by the API.
 * @returns A new, sorted array.
 */
export function sortSupplementLines(lines: RecipeCostBreakdownLine[]): RecipeCostBreakdownLine[] {
  const rank = (name: string) => {
    const index = (ADMIN_BREAKDOWN_ORDER as readonly string[]).indexOf(name);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...lines].sort((a, b) => rank(a.name) - rank(b.name));
}

/**
 * Sums the `total_cost` of breakdown lines (values may arrive as strings).
 *
 * @param lines - Lines to add up.
 */
export function sumBreakdown(lines: RecipeCostBreakdownLine[]): number {
  return lines.reduce((sum, line) => sum + Number(line.total_cost), 0);
}
