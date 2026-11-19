import { Anton, Archivo_Black, Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";

// The card art is drawn on <canvas>, so it needs the real font-family names (F.*), not just CSS variables.
export const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sc-sans" });
export const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
export const anton = Anton({ subsets: ["latin"], weight: "400" });
export const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-sc-mono" });

export const F = {
  sans: interTight.style.fontFamily,
  serif: instrumentSerif.style.fontFamily,
  anton: anton.style.fontFamily,
  black: archivoBlack.style.fontFamily,
  mono: jetbrains.style.fontFamily,
};

export const fontVars = [interTight.variable, jetbrains.variable].join(" ");
