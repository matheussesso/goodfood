import { Figtree } from "next/font/google";
import localFont from "next/font/local";

/**
 * Characterful grotesque for headlines and big numbers, close in spirit to the
 * brand's chunky lettering. Self-hosted (variable wght 600–800, Latin subset,
 * which covers Portuguese accents) because Turbopack's Google Fonts loader fails
 * on this multi-axis family in CI builds (`next/font/google queries have exactly
 * one entry`). Bricolage Grotesque is licensed under the SIL OFL.
 */
export const bricolage = localFont({
  src: [{ path: "./fonts/bricolage-grotesque-latin.woff2", weight: "600 800", style: "normal" }],
  variable: "--font-bricolage",
  display: "swap",
});

/** Friendly, highly legible sans for body text and UI. */
export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});
