import { Big_Shoulders, Caveat, Inter } from "next/font/google";
import Kalpa from "@/components/Kalpa";

// "Big Shoulders Display" is now the opsz axis of the variable Big Shoulders family
const disp = Big_Shoulders({ variable: "--font-kalpa-disp", subsets: ["latin"], axes: ["opsz"], adjustFontFallback: false });
const body = Inter({ variable: "--font-kalpa-body", subsets: ["latin"], weight: ["400", "500", "600"] });
const hand = Caveat({ variable: "--font-kalpa-hand", subsets: ["latin"], weight: ["500", "700"] });

export const metadata = {
  title: "Kalpa — Straight from the palm",
  description: "A scroll-driven 3D story for a tender coconut water: the coconut cracks open and a can pops out.",
};

export default function KalpaPage() {
  return <Kalpa className={`${disp.variable} ${body.variable} ${hand.variable}`} />;
}
