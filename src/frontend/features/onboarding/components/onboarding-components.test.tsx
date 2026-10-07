import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dog } from "lucide-react";
import { renderWithProviders, messages } from "@/test/render-intl";
import { axiosResponse } from "@/test/query-utils";
import type { DashboardProgress } from "@/hooks/useDashboard";
import { getJourney } from "@/features/onboarding/journey";
import { JourneyStepper } from "./JourneyStepper";
import { NextStepCard } from "./NextStepCard";
import { JourneyEmptyState } from "./JourneyEmptyState";
import { GettingStarted } from "@/features/dashboard/components/GettingStarted";
import { ContinueSetupBanner } from "@/features/dashboard/components/ContinueSetupBanner";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import { apiClient } from "@/lib/api-client";

const O = messages.Onboarding;

const progress = (overrides: Partial<DashboardProgress> = {}): DashboardProgress => ({
  has_address: false,
  pets_count: 0,
  own_recipes_count: 0,
  linked_recipes_count: 0,
  first_unlinked_recipe_id: null,
  orders_count: 0,
  subscriptions_count: 0,
  next_step: "add_pet",
  ...overrides,
});

const dashboardResponse = (p: DashboardProgress) =>
  axiosResponse({
    success: true,
    data: {
      progress: p,
      onboarding_dismissed: false,
      alerts: { pending_invoices: [], overdue_vaccines: [], incomplete_pets: [] },
      current_order: null,
      active_subscription: null,
      pets: [],
      recent_orders: [],
    },
  });

beforeEach(() => {
  vi.mocked(apiClient.get).mockReset();
  vi.mocked(apiClient.post).mockReset();
  vi.mocked(apiClient.delete).mockReset();
});

describe("JourneyStepper", () => {
  it("renders four linked steps and flags only the current one", () => {
    renderWithProviders(<JourneyStepper steps={getJourney(progress({ pets_count: 1 }))} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items.map((li) => li.getAttribute("aria-current"))).toEqual([null, "step", null, null]);
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual([
      "/pets/new",
      "/recipes/new",
      "/recipes",
      "/orders/new",
    ]);
  });

  it("hides step descriptions in compact mode", () => {
    renderWithProviders(<JourneyStepper steps={getJourney(progress())} compact />);
    expect(screen.queryByText(O.step_pet_desc)).not.toBeInTheDocument();
  });
});

describe("NextStepCard", () => {
  it("points to the current step's destination", () => {
    const [pet] = getJourney(progress());
    renderWithProviders(<NextStepCard step={pet} />);

    expect(screen.getByRole("heading", { name: O.step_pet })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/pets/new");
    expect(screen.getByText(O.cta_pet)).toBeInTheDocument();
  });
});

describe("JourneyEmptyState", () => {
  it("offers the current step's CTA and the stepper once the summary loads", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(dashboardResponse(progress({ pets_count: 1 })));
    renderWithProviders(<JourneyEmptyState icon={<Dog />} title="Nothing here" description="Add something" />);

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: O.cta_recipe })).toHaveAttribute("href", "/recipes/new");
    expect(screen.getByRole("list", { name: O.journey_label })).toBeInTheDocument();
  });

  it("falls back to the given action when the journey is complete", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      dashboardResponse(progress({ pets_count: 1, own_recipes_count: 1, linked_recipes_count: 1, orders_count: 1 }))
    );
    renderWithProviders(
      <JourneyEmptyState icon={<Dog />} title="t" description="d" fallbackAction={{ href: "/pets/new", label: "Add pet" }} />
    );

    expect(await screen.findByRole("link", { name: "Add pet" })).toHaveAttribute("href", "/pets/new");
  });

  it("renders custom actions instead of the default CTA", () => {
    vi.mocked(apiClient.get).mockResolvedValue(dashboardResponse(progress()));
    renderWithProviders(<JourneyEmptyState icon={<Dog />} title="t" description="d" actions={<button>Custom</button>} />);

    expect(screen.getByRole("button", { name: "Custom" })).toBeInTheDocument();
  });
});

describe("GettingStarted", () => {
  it("greets the customer, shows progress and dismisses the guide", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true }));
    renderWithProviders(<GettingStarted progress={progress({ pets_count: 1 })} name="Ana" />);

    expect(screen.getByRole("heading", { name: O.welcome_title.replace("{name}", "Ana") })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");

    await userEvent.click(screen.getByRole("button", { name: new RegExp(O.dismiss) }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith("/onboarding/dismiss"));
  });

  it("asks for the address only while it is missing", () => {
    const { unmount } = renderWithProviders(<GettingStarted progress={progress()} name="Ana" />);
    expect(screen.getByRole("link", { name: O.address_cta })).toHaveAttribute("href", "/profile?section=address");
    unmount();

    renderWithProviders(<GettingStarted progress={progress({ has_address: true })} name="Ana" />);
    expect(screen.queryByRole("link", { name: O.address_cta })).not.toBeInTheDocument();
  });
});

describe("ContinueSetupBanner", () => {
  it("links to the pending step and restores the guide", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(axiosResponse({ success: true }));
    renderWithProviders(<ContinueSetupBanner progress={progress({ pets_count: 1 })} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/recipes/new");

    await userEvent.click(screen.getByRole("button", { name: O.show_guide }));
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith("/onboarding/dismiss"));
  });

  it("renders nothing when the journey is finished", () => {
    const { container } = renderWithProviders(
      <ContinueSetupBanner progress={progress({ pets_count: 1, own_recipes_count: 1, linked_recipes_count: 1, orders_count: 1 })} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
