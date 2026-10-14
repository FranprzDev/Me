import { Fraunces, IBM_Plex_Sans } from "next/font/google";

/* Print-only families (same as /me): the paper résumé and its PDFs use them, the screen uses the portfolio type. */

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--cv-font-display",
  display: "swap",
  // Only the print layout uses these families: no preload on screen.
  preload: false,
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--cv-font-sans",
  display: "swap",
  // Only the print layout uses these families: no preload on screen.
  preload: false,
});

export const cvFontClassName = `${display.variable} ${sans.variable}`;
