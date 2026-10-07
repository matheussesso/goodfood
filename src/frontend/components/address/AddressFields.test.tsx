import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/pt.json";
import { fetchAddressByCep } from "@/lib/viacep";
import { AddressFields, EMPTY_ADDRESS, type AddressErrors, type AddressValue } from "./AddressFields";

vi.mock("@/lib/viacep", () => ({ fetchAddressByCep: vi.fn() }));

/** Controlled host so the component receives its own patches back. */
function Host({ errors, onPatch }: { errors?: AddressErrors; onPatch?: (patch: Partial<AddressValue>) => void }) {
  const [value, setValue] = useState<AddressValue>(EMPTY_ADDRESS);
  return (
    <NextIntlClientProvider locale="pt" messages={messages}>
      <AddressFields
        value={value}
        errors={errors}
        idPrefix="t"
        onChange={(patch) => {
          onPatch?.(patch);
          setValue((v) => ({ ...v, ...patch }));
        }}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AddressFields", () => {
  it("masks the CEP and looks up the address once 8 digits are typed", async () => {
    vi.mocked(fetchAddressByCep).mockResolvedValue({
      street: "Avenida Paulista",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    });
    render(<Host />);

    await userEvent.type(screen.getByLabelText("CEP"), "01310100");

    expect(screen.getByLabelText("CEP")).toHaveValue("01310-100");
    expect(fetchAddressByCep).toHaveBeenCalledTimes(1);
    expect(fetchAddressByCep).toHaveBeenCalledWith("01310100");
    await waitFor(() => expect(screen.getByLabelText("Rua / Logradouro")).toHaveValue("Avenida Paulista"));
    expect(screen.getByLabelText("Bairro")).toHaveValue("Bela Vista");
    expect(screen.getByLabelText("Cidade")).toHaveValue("São Paulo");
    expect(screen.getByLabelText("Estado")).toHaveValue("SP");
  });

  it("does not look anything up for an incomplete CEP", async () => {
    render(<Host />);
    await userEvent.type(screen.getByLabelText("CEP"), "0131");
    expect(fetchAddressByCep).not.toHaveBeenCalled();
  });

  it("shows a not-found message when the CEP does not exist", async () => {
    vi.mocked(fetchAddressByCep).mockResolvedValue(null);
    render(<Host />);

    await userEvent.type(screen.getByLabelText("CEP"), "00000000");

    expect(await screen.findByText("CEP não encontrado.")).toBeInTheDocument();
  });

  it("shows a not-found message when the lookup fails", async () => {
    vi.mocked(fetchAddressByCep).mockRejectedValue(new Error("offline"));
    render(<Host />);

    await userEvent.type(screen.getByLabelText("CEP"), "01310100");

    expect(await screen.findByText("CEP não encontrado.")).toBeInTheDocument();
  });

  it("reports only the edited field", async () => {
    const onPatch = vi.fn();
    render(<Host onPatch={onPatch} />);

    await userEvent.type(screen.getByLabelText("Número"), "1");

    expect(onPatch).toHaveBeenCalledWith({ number: "1" });
  });

  it("renders validation errors passed by the parent", () => {
    render(<Host errors={{ street: "Campo obrigatório.", state: "Campo obrigatório." }} />);
    expect(screen.getAllByText("Campo obrigatório.")).toHaveLength(2);
  });
});
