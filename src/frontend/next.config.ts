import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * Origin of the Laravel backend that serves pet photos from /storage.
 * Derived from NEXT_PUBLIC_API_URL (e.g. "http://localhost:8000/api").
 */
const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
);

// Note: do NOT enable experimental.globalNotFound here — it intercepts
// unprefixed URLs before the next-intl middleware rewrite, breaking every
// default-locale route (localePrefix: "as-needed"). 404s are handled by
// app/[locale]/[...rest] + app/[locale]/not-found.tsx instead.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/storage/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
