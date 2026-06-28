/**
 * Formats a number as Brazilian Real currency string (e.g. "1.000,00").
 * Does NOT include the "R$" prefix — use with the JSX `R$ ` literal or
 * pass `withPrefix: true` to get the full label.
 *
 * @param value - Numeric value to format.
 * @param withPrefix - When true, returns "R$ 1.000,00".
 * @returns Formatted string.
 */
export function formatBRL(value: number | string, withPrefix = false): string {
  const formatted = Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withPrefix ? `R$ ${formatted}` : formatted;
}
