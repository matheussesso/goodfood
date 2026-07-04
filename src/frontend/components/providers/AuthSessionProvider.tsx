"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Restores the authenticated session on page load by asking the backend
 * who the current user is (the credential is an httpOnly cookie, invisible
 * to JavaScript). Marks the session as resolved either way so guards like
 * DashboardLayout know when it is safe to redirect.
 *
 * @param children - The subtree that depends on the session state.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuth((s) => s.restoreSession);
  const markSessionResolved = useAuth((s) => s.markSessionResolved);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get("/me")
      .then(({ data }) => {
        if (!cancelled && data?.data) {
          restoreSession(data.data);
        }
      })
      .catch(() => {
        // No valid session cookie — stay logged out.
      })
      .finally(() => {
        if (!cancelled) {
          markSessionResolved();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [restoreSession, markSessionResolved]);

  return <>{children}</>;
}
