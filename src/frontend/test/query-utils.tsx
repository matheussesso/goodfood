import type { ReactNode } from "react";
import type { AxiosResponse } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Creates a QueryClient with retries disabled so failures surface immediately in tests. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/**
 * Builds a React wrapper component that provides the given QueryClient.
 *
 * @param queryClient - The client to expose to the hook under test.
 * @returns A wrapper component suitable for `renderHook({ wrapper })`.
 */
export function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * Wraps a payload in the minimal Axios response shape the hooks read from.
 *
 * @param data - The value to expose as `response.data`.
 * @returns A fake Axios response.
 */
export function axiosResponse<T>(data: T): AxiosResponse<T> {
  return { data } as AxiosResponse<T>;
}
