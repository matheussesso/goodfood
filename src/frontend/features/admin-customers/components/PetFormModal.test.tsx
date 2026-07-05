import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import messages from "@/messages/pt.json";
import { Pet } from "@/hooks/usePets";
import { PetFormModal } from "./PetFormModal";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    put: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

/** Renders UI inside the intl + react-query providers the modal expects. */
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

const pet: Pet = {
  id: 7,
  user_id: 3,
  name: "Rex",
  type: "dog",
  breed: "Vira-lata",
  weight: 12.5,
  age: 24,
} as Pet;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PetFormModal", () => {
  it("renders the create title and empty fields when no pet is given", () => {
    const { getByText, queryByDisplayValue } = renderWithProviders(
      <PetFormModal customerId={3} pet={null} isOpen onClose={() => {}} />
    );

    expect(getByText("Novo Pet")).toBeInTheDocument();
    expect(queryByDisplayValue("Rex")).not.toBeInTheDocument();
  });

  it("seeds the form from the pet when editing", () => {
    const { getByText, getByDisplayValue } = renderWithProviders(
      <PetFormModal customerId={3} pet={pet} isOpen onClose={() => {}} />
    );

    expect(getByText("Editar Pet")).toBeInTheDocument();
    expect(getByDisplayValue("Rex")).toBeInTheDocument();
    expect(getByDisplayValue("Vira-lata")).toBeInTheDocument();
    expect(getByDisplayValue("12.5")).toBeInTheDocument();
    expect(getByDisplayValue("24")).toBeInTheDocument();
  });
});
