import { Fraunces, IBM_Plex_Sans } from "next/font/google";

/* Same families as /me, so the résumé reads as part of the portfolio. */

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--cv-font-display",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--cv-font-sans",
  display: "swap",
});

export const cvFontClassName = `${display.variable} ${sans.variable}`;
