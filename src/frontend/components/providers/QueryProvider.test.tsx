import { describe, it, expect, vi } from "vitest";
import { createAppQueryClient } from "./QueryProvider";
import { DASHBOARD_QUERY_KEY } from "@/hooks/useDashboard";

describe("createAppQueryClient", () => {
  it("invalidates the dashboard after any successful mutation", async () => {
    const client = createAppQueryClient();
    client.setQueryData(DASHBOARD_QUERY_KEY, { stale: false });
    const spy = vi.spyOn(client, "invalidateQueries");

    await client.getMutationCache().build(client, { mutationFn: async () => "ok" }).execute(undefined);

    expect(spy).toHaveBeenCalledWith({ queryKey: DASHBOARD_QUERY_KEY });
    expect(client.getQueryState(DASHBOARD_QUERY_KEY)?.isInvalidated).toBe(true);
  });

  it("does not invalidate the dashboard when the mutation fails", async () => {
    const client = createAppQueryClient();
    client.setQueryData(DASHBOARD_QUERY_KEY, { stale: false });

    await expect(
      client.getMutationCache().build(client, { mutationFn: async () => { throw new Error("boom"); } }).execute(undefined)
    ).rejects.toThrow("boom");

    expect(client.getQueryState(DASHBOARD_QUERY_KEY)?.isInvalidated).toBe(false);
  });

  it("keeps the default 60s stale time and no refetch on focus", () => {
    const defaults = createAppQueryClient().getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(60_000);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
  });
});
