import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, messages } from "@/test/render-intl";
import { axiosResponse } from "@/test/query-utils";
import { useAuth, type User } from "@/hooks/useAuth";
import type { DashboardData } from "@/hooks/useDashboard";
import DashboardPage from "./page";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import { apiClient } from "@/lib/api-client";

const user = (role: User["role"]): User => ({ id: 1, name: "Ana Souza", email: "a@b.c", role });

const data = (overrides: Partial<DashboardData> = {}, progress: Partial<DashboardData["progress"]> = {}): DashboardData => ({
  progress: {
    has_address: false,
    pets_count: 0,
    own_recipes_count: 0,
    linked_recipes_count: 0,
    first_unlinked_recipe_id: null,
    orders_count: 0,
    subscriptions_count: 0,
    next_step: "add_pet",
    ...progress,
  },
  onboarding_dismissed: false,
  alerts: { pending_invoices: [], overdue_vaccines: [], incomplete_pets: [] },
  current_order: null,
  active_subscription: null,
  pets: [],
  recent_orders: [],
  ...overrides,
});

const respondWith = (payload: DashboardData) =>
  vi.mocked(apiClient.get).mockResolvedValue(axiosResponse({ success: true, data: payload }));

beforeEach(() => {
  vi.mocked(apiClient.get).mockReset();
  useAuth.setState({ user: user("customer"), isAuthenticated: true, isSessionResolved: true });
});

describe("DashboardPage", () => {
  it("shows only the guide and quick actions for a brand-new account", async () => {
    respondWith(data());
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: messages.Onboarding.welcome_title.replace("{name}", "Ana") })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: messages.Dashboard.section_pets })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: messages.Dashboard.section_recent })).not.toBeInTheDocument();
  });

  it("keeps a continue-setup banner when the guide was dismissed", async () => {
    respondWith(data({ onboarding_dismissed: true }, { pets_count: 1, next_step: "create_recipe" }));
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("button", { name: messages.Onboarding.show_guide })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Bem-vind/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: messages.Dashboard.section_pets })).toBeInTheDocument();
  });

  it("renders the pets and recent orders of an active account without the guide", async () => {
    respondWith(
      data(
        {
          pets: [{ id: 3, name: "Rex", type: "dog", recipes: [{ id: 1, name: "Frango" }] }],
          recent_orders: [{ id: 8, status: "pending", total_price: "90.00", items_count: 1, invoice_status: null, created_at: "2026-10-01T10:00:00Z" }],
        },
        { has_address: true, pets_count: 1, own_recipes_count: 1, linked_recipes_count: 1, orders_count: 1, next_step: "complete" }
      )
    );
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("link", { name: "Rex" })).toHaveAttribute("href", "/pets/3");
    expect(screen.getByRole("link", { name: /Pedido #8/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Bem-vind/ })).not.toBeInTheDocument();
  });

  it("offers a retry when the request fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("boom"));
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.Dashboard.error_title);
    expect(screen.getByRole("button", { name: messages.Common.try_again })).toBeInTheDocument();
  });

  it("shows role shortcuts instead of customer data for staff", () => {
    useAuth.setState({ user: user("producer") });
    renderWithProviders(<DashboardPage />);

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});
