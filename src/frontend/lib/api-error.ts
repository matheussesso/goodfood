import { AxiosError } from "axios";

/**
 * Extracts the backend's `message` field from an API error response,
 * following the `{ success, message, data, errors? }` contract, falling
 * back to a default message when the error doesn't match that shape.
 *
 * @param error - The unknown value caught from a failed request.
 * @param fallback - Message to use when no backend message is available.
 * @returns A user-facing error message.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }

  return fallback;
}
