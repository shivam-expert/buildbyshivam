import { Instrument_Serif, Inter_Tight } from "next/font/google";
import StoneScent from "@/components/StoneScent";

const sans = Inter_Tight({ variable: "--font-stone-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const serif = Instrument_Serif({ variable: "--font-stone-serif-src", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata = {
  title: "Basalt — The scent of stones",
  description: "A scroll-driven 3D story for a mineral fragrance: the stone breaks, the flacon appears.",
};

export default function StoneScentPage() {
  return <StoneScent className={`${sans.variable} ${serif.variable}`} />;
}
