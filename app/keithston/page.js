import { Lobster_Two, Poppins } from "next/font/google";
import Keithston from "@/components/Keithston";

const script = Lobster_Two({ variable: "--font-ks-script", subsets: ["latin"], weight: "700", style: "italic" });
const body = Poppins({ variable: "--font-ks-body", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "Keithston — Sweet Treats, Perfect Eats",
  description: "An animated landing page for a small-batch bakery and coffee shop.",
};

export default function KeithstonPage() {
  return <Keithston className={`${script.variable} ${body.variable}`} />;
}
