import { Inter, Rubik } from "next/font/google";
import ClogStory from "@/components/ClogStory";

const disp = Rubik({
  variable: "--font-clog-disp",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

const body = Inter({
  variable: "--font-clog-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "squish — Clog scroll story",
  description: "A scroll-driven story for a foam clog: six colors, one shoe.",
};

export default function ClogPage() {
  return <ClogStory className={`${disp.variable} ${body.variable}`} />;
}
