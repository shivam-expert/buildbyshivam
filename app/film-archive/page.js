import { EB_Garamond, Inter_Tight, Noto_Serif_JP, Playfair_Display } from "next/font/google";
import FilmArchive from "@/components/FilmArchive";

const sans = Inter_Tight({ variable: "--font-kaito-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Playfair_Display({ variable: "--font-kaito-display", subsets: ["latin"], weight: ["500", "600"] });
const serif = EB_Garamond({ variable: "--font-kaito-serif-src", subsets: ["latin"], style: ["normal", "italic"] });
// Only a few kanji are used; skip preloading the large Japanese font files.
const jp = Noto_Serif_JP({ variable: "--font-kaito-jp-src", weight: "600", preload: false });

export const metadata = {
  title: "Kaito Mori — Film Archive",
  description: "A shelf of VHS tapes from a fictional director's archive. Hover, scroll or click a tape.",
};

export default function FilmArchivePage() {
  return <FilmArchive className={`${sans.variable} ${display.variable} ${serif.variable} ${jp.variable}`} />;
}
