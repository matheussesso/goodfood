import axios from "axios";

/**
 * Base URL of the Laravel API. Single source of truth for the fallback —
 * do not duplicate it anywhere else in the app.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Backend origin (API base without the /api suffix), used for Sanctum's
 * CSRF cookie endpoint which lives outside the /api prefix.
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * Shared Axios instance for all API calls. Authentication uses Sanctum's
 * stateful SPA mode: the session lives in an httpOnly cookie, and Axios
 * mirrors the XSRF-TOKEN cookie into the X-XSRF-TOKEN header on mutations.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});

let csrfCookiePromise: Promise<void> | null = null;

/**
 * Fetches Sanctum's CSRF cookie once per page load (memoized). Called
 * automatically before any mutating request; safe to call eagerly too.
 *
 * @throws {AxiosError} When the backend is unreachable.
 */
export function ensureCsrfCookie(): Promise<void> {
  if (!csrfCookiePromise) {
    csrfCookiePromise = axios
      .get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true })
      .then(() => undefined)
      .catch((error) => {
        // Allow a retry on the next mutation instead of caching the failure.
        csrfCookiePromise = null;
        throw error;
      });
  }
  return csrfCookiePromise;
}

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// Guarantee the CSRF cookie exists before any state-changing request.
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined" && MUTATING_METHODS.has(config.method ?? "")) {
    await ensureCsrfCookie();
  }
  return config;
});
