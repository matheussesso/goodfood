/**
 * Small input masks and format checks shared by every contact/address form.
 */

/**
 * Formats raw input as a Brazilian CEP (XXXXX-XXX), dropping non-digits and
 * anything beyond 8 digits.
 *
 * @param raw - Whatever the user typed.
 * @returns The masked CEP.
 */
export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * Whether a string looks like an e-mail address (`a@b.c`, no whitespace).
 *
 * @param email - The value to check.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Whether a `PhoneInput` value (`"+55 (11) 99999-9999"`) holds at least 4
 * digits after the country code.
 *
 * @param phone - The combined phone string.
 */
export function hasPhoneNumber(phone: string): boolean {
  const separator = phone.indexOf(" ");
  if (separator === -1) return false;
  return phone.slice(separator + 1).replace(/\D/g, "").length >= 4;
}
