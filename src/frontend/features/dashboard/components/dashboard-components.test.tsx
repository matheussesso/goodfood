import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, messages } from "@/test/render-intl";
import type { DashboardAlerts, DashboardPet, DashboardProgress, DashboardRecentOrder } from "@/hooks/useDashboard";
import { AlertsBar } from "./AlertsBar";
import { DashboardPetCard } from "./DashboardPetCard";
import { RecentOrders } from "./RecentOrders";

const progress: DashboardProgress = {
  has_address: true,
  pets_count: 1,
  own_recipes_count: 0,
  linked_recipes_count: 0,
  first_unlinked_recipe_id: null,
  orders_count: 0,
  subscriptions_count: 0,
  next_step: "create_recipe",
};

const noAlerts: DashboardAlerts = { pending_invoices: [], overdue_vaccines: [], incomplete_pets: [] };

describe("AlertsBar", () => {
  it("renders nothing when nothing needs attention", () => {
    const { container } = renderWithProviders(<AlertsBar alerts={noAlerts} progress={progress} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists invoices, vaccines and incomplete pets with links to fix them", () => {
    renderWithProviders(
      <AlertsBar
        alerts={{
          pending_invoices: [{ id: 1, order_id: 7, amount: "100.00", due_date: "2026-10-20" }],
          overdue_vaccines: [{ pet_id: 3, pet_name: "Rex", vaccine_name: "V10", next_due_date: "2026-09-01" }],
          incomplete_pets: [{ pet_id: 3, pet_name: "Rex", missing: ["weight", "breed"] }],
        }}
        progress={progress}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText(/Você tem 1 fatura aguardando pagamento/)).toBeInTheDocument();
    expect(screen.getByText(/Rex: vacina V10 venceu em/)).toBeInTheDocument();
    expect(screen.getByText("Rex: faltam peso, raça")).toBeInTheDocument();
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/orders/7", "/pets/3/edit", "/pets/3/edit"]);
  });

  it("asks for the address only once the customer has a pet", () => {
    const missing = { ...progress, has_address: false };
    const { unmount } = renderWithProviders(<AlertsBar alerts={noAlerts} progress={missing} />);
    expect(screen.getByRole("link", { name: messages.Dashboard.action_complete_address })).toHaveAttribute("href", "/profile?section=address");
    unmount();

    const { container } = renderWithProviders(<AlertsBar alerts={noAlerts} progress={{ ...missing, pets_count: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DashboardPetCard", () => {
  const pet = (overrides: Partial<DashboardPet> = {}): DashboardPet => ({ id: 5, name: "Mel", type: "cat", recipes: [], ...overrides });

  it("suggests creating a recipe for a pet that has none", () => {
    renderWithProviders(<ul><DashboardPetCard pet={pet()} /></ul>);

    expect(screen.getByRole("link", { name: "Criar receita para Mel" })).toHaveAttribute("href", "/recipes/new?pet_id=5");
    expect(screen.queryByRole("link", { name: messages.Dashboard.order_for_pet })).not.toBeInTheDocument();
  });

  it("offers ordering once the pet has a linked recipe", () => {
    renderWithProviders(<ul><DashboardPetCard pet={pet({ recipes: [{ id: 1, name: "Frango" }] })} /></ul>);

    expect(screen.getByRole("link", { name: messages.Dashboard.order_for_pet })).toHaveAttribute("href", "/orders/new");
    expect(screen.getByText("Frango")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.Dashboard.view_pet })).toHaveAttribute("href", "/pets/5");
  });
});

describe("RecentOrders", () => {
  const order = (id: number): DashboardRecentOrder => ({
    id,
    status: "pending",
    total_price: "150.00",
    items_count: 2,
    invoice_status: null,
    created_at: "2026-10-01T12:00:00Z",
  });

  it("shows an empty message and no 'view all' link without orders", () => {
    renderWithProviders(<RecentOrders orders={[]} />);

    expect(screen.getByText(messages.Dashboard.no_recent_orders)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links each order to its detail page", () => {
    renderWithProviders(<RecentOrders orders={[order(11), order(10)]} />);

    expect(screen.getByRole("link", { name: messages.Dashboard.view_all })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: /Pedido #11/ })).toHaveAttribute("href", "/orders/11");
    expect(screen.getAllByText(/2 receitas/)).toHaveLength(2);
  });
});
