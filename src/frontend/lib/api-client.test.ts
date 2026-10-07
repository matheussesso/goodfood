import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";

type RequestInterceptor = (config: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>;

const axiosMock = vi.hoisted(() => {
  const state: { interceptor: RequestInterceptor | null } = { interceptor: null };
  const instance = {
    interceptors: {
      request: {
        use: vi.fn((fn: RequestInterceptor) => {
          state.interceptor = fn;
        }),
      },
    },
  };
  return {
    state,
    instance,
    create: vi.fn(() => instance),
    get: vi.fn(),
  };
});

vi.mock("axios", () => ({
  default: { create: axiosMock.create, get: axiosMock.get },
}));

/** Loads a fresh copy of the module so the memoized CSRF promise starts empty. */
async function loadModule() {
  vi.resetModules();
  return import("./api-client");
}

/** Builds a minimal request config for the given HTTP method. */
function configFor(method?: string): InternalAxiosRequestConfig {
  return { method } as InternalAxiosRequestConfig;
}

/** Returns the interceptor registered by the module under test. */
function getInterceptor(): RequestInterceptor {
  if (!axiosMock.state.interceptor) throw new Error("Interceptor was not registered");
  return axiosMock.state.interceptor;
}

beforeEach(() => {
  vi.clearAllMocks();
  axiosMock.state.interceptor = null;
  axiosMock.get.mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("apiClient setup", () => {
  it("creates the shared instance with credentials, XSRF and JSON headers", async () => {
    const { API_BASE_URL, apiClient } = await loadModule();

    expect(apiClient).toBe(axiosMock.instance);
    expect(axiosMock.create).toHaveBeenCalledWith({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      withCredentials: true,
      withXSRFToken: true,
    });
  });

  it("derives the API origin by stripping the /api suffix", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/api/");

    const { API_BASE_URL, API_ORIGIN } = await loadModule();

    expect(API_BASE_URL).toBe("https://api.example.com/api/");
    expect(API_ORIGIN).toBe("https://api.example.com");
  });
});

describe("ensureCsrfCookie", () => {
  it("requests the Sanctum cookie endpoint once and memoizes the promise", async () => {
    const { ensureCsrfCookie, API_ORIGIN } = await loadModule();

    await Promise.all([ensureCsrfCookie(), ensureCsrfCookie()]);
    await ensureCsrfCookie();

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.get).toHaveBeenCalledWith(`${API_ORIGIN}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  });

  it("resolves with undefined", async () => {
    const { ensureCsrfCookie } = await loadModule();

    await expect(ensureCsrfCookie()).resolves.toBeUndefined();
  });

  it("rejects on failure and retries on the next call instead of caching the failure", async () => {
    const { ensureCsrfCookie } = await loadModule();
    axiosMock.get.mockRejectedValueOnce(new Error("backend down"));

    await expect(ensureCsrfCookie()).rejects.toThrow("backend down");
    await expect(ensureCsrfCookie()).resolves.toBeUndefined();

    expect(axiosMock.get).toHaveBeenCalledTimes(2);

    // Once it succeeded, the result is memoized again.
    await ensureCsrfCookie();
    expect(axiosMock.get).toHaveBeenCalledTimes(2);
  });
});

describe("request interceptor", () => {
  it.each(["post", "put", "patch", "delete"])(
    "fetches the CSRF cookie before %s requests and returns the config",
    async (method) => {
      await loadModule();
      const config = configFor(method);

      await expect(getInterceptor()(config)).resolves.toBe(config);

      expect(axiosMock.get).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["get", "head", "options"])("does not fetch the CSRF cookie for %s", async (method) => {
    await loadModule();
    const config = configFor(method);

    await expect(getInterceptor()(config)).resolves.toBe(config);

    expect(axiosMock.get).not.toHaveBeenCalled();
  });

  it("does not fetch the CSRF cookie when the method is undefined", async () => {
    await loadModule();

    await getInterceptor()(configFor(undefined));

    expect(axiosMock.get).not.toHaveBeenCalled();
  });

  it("reuses the memoized cookie request across several mutations", async () => {
    await loadModule();
    const interceptor = getInterceptor();

    await interceptor(configFor("post"));
    await interceptor(configFor("put"));

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
  });

  it("rejects the mutating request when the cookie request fails", async () => {
    await loadModule();
    axiosMock.get.mockRejectedValueOnce(new Error("backend down"));

    await expect(getInterceptor()(configFor("post"))).rejects.toThrow("backend down");
  });

  it("skips the cookie request outside the browser (no window)", async () => {
    await loadModule();
    vi.stubGlobal("window", undefined);
    try {
      await getInterceptor()(configFor("post"));
    } finally {
      vi.unstubAllGlobals();
    }

    expect(axiosMock.get).not.toHaveBeenCalled();
  });
});
