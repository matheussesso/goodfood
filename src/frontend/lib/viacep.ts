/**
 * Address data returned by the ViaCEP public API, normalized to the
 * field names used across the app's address forms.
 */
export interface ViaCepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Looks up a Brazilian postal code (CEP) on the ViaCEP public API.
 *
 * @param digits - The CEP as an 8-digit string (numbers only).
 * @returns The normalized address, or `null` when the CEP does not exist.
 * @throws {Error} When the network request fails.
 */
export async function fetchAddressByCep(
  digits: string
): Promise<ViaCepAddress | null> {
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  const json = await res.json();

  if (json.erro) {
    return null;
  }

  return {
    street: json.logradouro || "",
    neighborhood: json.bairro || "",
    city: json.localidade || "",
    state: json.uf || "",
  };
}
