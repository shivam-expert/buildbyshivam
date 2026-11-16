import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import BagSwap from "@/components/BagSwap";

const serif = Instrument_Serif({
  variable: "--font-bag-serif",
  subsets: ["latin"],
  weight: "400",
});

const mono = JetBrains_Mono({
  variable: "--font-bag-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata = {
  title: "Nola. — Bag Swap",
  description: "Tap a bag and watch it swap onto the model.",
};

export default function BagSwapPage() {
  return <BagSwap className={`${serif.variable} ${mono.variable}`} />;
}
