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

const nextConfig: NextConfig = {
  experimental: {
    // Required because the root layout lives under the dynamic [locale]
    // segment; unmatched URLs are handled by app/global-not-found.tsx.
    globalNotFound: true,
  },
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
