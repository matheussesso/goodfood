import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAddressByCep } from "./viacep";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAddressByCep", () => {
  it("maps the ViaCEP payload to the app's address fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
        uf: "SP",
      }),
    }));

    const address = await fetchAddressByCep("01310100");

    expect(fetch).toHaveBeenCalledWith("https://viacep.com.br/ws/01310100/json/");
    expect(address).toEqual({
      street: "Avenida Paulista",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    });
  });

  it("returns null when ViaCEP flags the CEP as nonexistent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ erro: true }),
    }));

    expect(await fetchAddressByCep("00000000")).toBeNull();
  });

  it("normalizes missing fields to empty strings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ localidade: "São Paulo", uf: "SP" }),
    }));

    expect(await fetchAddressByCep("01310100")).toEqual({
      street: "",
      neighborhood: "",
      city: "São Paulo",
      state: "SP",
    });
  });

  it("propagates network failures to the caller", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchAddressByCep("01310100")).rejects.toThrow("offline");
  });
});
