"use client"; // Error boundaries must be Client Components

/**
 * Global error boundary: replaces the root layout when an error escapes it,
 * so it must render its own <html>/<body>. Rendered outside the [locale]
 * tree, so it cannot use next-intl — copy is intentionally static English.
 *
 * @param error - The error that escaped the root layout.
 * @param unstable_retry - Next.js callback that retries rendering.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Something went wrong.</h2>
          {error.digest && <p style={{ fontSize: "0.8rem", color: "#666" }}>{error.digest}</p>}
          <button onClick={() => unstable_retry()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
