import { Bricolage_Grotesque, Figtree } from "next/font/google";

/** Characterful grotesque for headlines and big numbers, close in spirit to the brand's chunky lettering. */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
