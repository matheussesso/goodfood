import localFont from "next/font/local";

/*
 * Both landing fonts are self-hosted (variable, Latin subset — enough for
 * Portuguese accents). Turbopack's `next/font/google` loader fails with
 * "queries have exactly one entry" on these families in some environments
 * (CI runner and local dev), and bundling the files also removes any network
 * dependency at build time. Both fonts are licensed under the SIL OFL.
 */

/** Characterful grotesque for headlines and big numbers (variable wght 600–800). */
export const bricolage = localFont({
  src: [{ path: "./fonts/bricolage-grotesque-latin.woff2", weight: "600 800", style: "normal" }],
  variable: "--font-bricolage",
  display: "swap",
});

/** Friendly, highly legible sans for body text and UI (variable wght 400–700). */
export const figtree = localFont({
  src: [{ path: "./fonts/figtree-latin.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-figtree",
  display: "swap",
});
