import type { DashboardProgress } from "@/hooks/useDashboard";

/** The four steps between signing up and the first order. */
export type JourneyStepId = "pet" | "recipe" | "link" | "order";

/** Where a step stands for the current customer. */
export type JourneyStepStatus = "done" | "current" | "upcoming";

/** One step of the journey with its status and destination. */
export interface JourneyStep {
  id: JourneyStepId;
  status: JourneyStepStatus;
  href: string;
}

/** Steps in the order they must be completed. */
export const JOURNEY_ORDER: readonly JourneyStepId[] = ["pet", "recipe", "link", "order"];

/**
 * Where a step sends the user.
 *
 * @param id - The step.
 * @param progress - The customer's progress (the "link" step jumps straight to the recipe to link, when there is one).
 */
export function getStepHref(id: JourneyStepId, progress: DashboardProgress): string {
  switch (id) {
    case "pet":
      return "/pets/new";
    case "recipe":
      return "/recipes/new";
    case "link":
      return progress.first_unlinked_recipe_id ? `/recipes/${progress.first_unlinked_recipe_id}/edit` : "/recipes";
    case "order":
      return "/orders/new";
  }
}

/**
 * Turns the backend progress into the ordered list of steps. The first step
 * that is not done is "current"; the ones after it are "upcoming".
 *
 * @param progress - Dashboard progress counts.
 * @returns The four steps with their status and href.
 */
export function getJourney(progress: DashboardProgress): JourneyStep[] {
  const done: Record<JourneyStepId, boolean> = {
    pet: progress.pets_count > 0,
    recipe: progress.own_recipes_count > 0,
    link: progress.linked_recipes_count > 0,
    order: progress.orders_count + progress.subscriptions_count > 0,
  };

  let currentAssigned = false;

  return JOURNEY_ORDER.map((id) => {
    let status: JourneyStepStatus = "done";
    if (!done[id]) {
      status = currentAssigned ? "upcoming" : "current";
      currentAssigned = true;
    }
    return { id, status, href: getStepHref(id, progress) };
  });
}

/**
 * The step the customer should do now, or null when the journey is finished.
 *
 * @param steps - Result of {@link getJourney}.
 */
export function getCurrentStep(steps: JourneyStep[]): JourneyStep | null {
  return steps.find((step) => step.status === "current") ?? null;
}

/**
 * How many steps are done.
 *
 * @param steps - Result of {@link getJourney}.
 */
export function countDone(steps: JourneyStep[]): number {
  return steps.filter((step) => step.status === "done").length;
}
