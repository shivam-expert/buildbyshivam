import { DM_Sans, Unbounded } from "next/font/google";
import BuildByShivamLanding from "@/components/BuildByShivamLanding";

const display = Unbounded({ variable: "--font-bbs-disp", subsets: ["latin"], weight: ["500", "700", "800"] });
const sans = DM_Sans({ variable: "--font-bbs-sans", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata = {
  title: "Build by Shivam — Frontend developer",
  description:
    "Freelance frontend developer building fast, animated websites in React, Next.js and Shopify.",
};

export default function Home() {
  return <BuildByShivamLanding className={`${display.variable} ${sans.variable}`} />;
}
