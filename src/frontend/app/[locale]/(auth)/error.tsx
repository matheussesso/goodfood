"use client"; // Error boundaries must be Client Components

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Error boundary for the auth routes (login/register). Shows a friendly
 * message and a retry button that re-renders the failed segment.
 *
 * @param error - The error thrown by the segment below this boundary.
 * @param unstable_retry - Next.js callback that retries rendering the segment.
 */
export default function AuthError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-6">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        {t("something_went_wrong")}
      </h2>
      {error.digest && (
        <p className="text-xs text-muted-foreground">{error.digest}</p>
      )}
      <Button variant="outline" onClick={() => unstable_retry()}>
        {t("try_again")}
      </Button>
    </div>
  );
}
