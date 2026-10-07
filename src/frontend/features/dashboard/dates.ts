/**
 * Parses an API date. Date-only strings (`YYYY-MM-DD`) are read as local
 * midnight so they never shift a day because of the timezone.
 *
 * @param value - ISO date or datetime string from the API.
 */
export function parseApiDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}
