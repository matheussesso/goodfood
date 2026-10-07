import type { Subscription, SubscriptionRecipe } from "@/hooks/useSubscriptions";

/**
 * Translator signature accepted by the helpers below (a next-intl `t` function
 * scoped to the Subscriptions namespace).
 */
type SubscriptionsTranslator = (key: "current_week_progress", values: { current: string; total: string }) => string;

/**
 * Formats a plan's week progress, e.g. "Semana 2 de 4".
 *
 * @param sub - The subscription to describe.
 * @param t - Subscriptions-namespace translator.
 * @returns The label, or null when the plan has not started, has ended, or has no cycles.
 */
export function weekProgressLabel(sub: Subscription, t: SubscriptionsTranslator): string | null {
  if (sub.current_cycle_index === null || sub.current_cycle_index === undefined) return null;
  if (!sub.total_cycles) return null;

  return t("current_week_progress", {
    current: String(sub.current_cycle_index + 1),
    total: String(sub.total_cycles),
  });
}

/**
 * Returns a plan's recipes ordered by week (pivot position).
 *
 * @param recipes - The plan's recipes, in any order.
 * @returns A new array sorted by `pivot.position`.
 */
export function sortRecipesByWeek(recipes: SubscriptionRecipe[] | undefined): SubscriptionRecipe[] {
  return [...(recipes ?? [])].sort((a, b) => (a.pivot?.position ?? 0) - (b.pivot?.position ?? 0));
}
