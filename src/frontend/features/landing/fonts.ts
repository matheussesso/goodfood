import { Poppins } from "next/font/google";

/** Friendly geometric sans used for all landing text. */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});
