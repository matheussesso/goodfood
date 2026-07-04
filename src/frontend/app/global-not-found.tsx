import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

/**
 * Global 404 page for URLs that match no route at all (including no locale
 * prefix). Rendered outside the [locale] tree, so it cannot use next-intl —
 * copy is intentionally static English.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>404 - Page Not Found</h2>
          <p>The page you are looking for does not exist.</p>
          <a href="/">Return home</a>
        </div>
      </body>
    </html>
  );
}
