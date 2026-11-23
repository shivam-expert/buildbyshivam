import { Inter, JetBrains_Mono } from "next/font/google";
import NorthWatch from "@/components/NorthWatch";

// Archivo (with the wdth axis) is already loaded by the root layout as --font-archivo.
const body = Inter({ variable: "--font-north-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-north-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "NORTH° — Find your heading",
  description: "A scroll-driven launch page for a navigation smartwatch: a live 3D watch assembles, changes strap and face per chapter.",
};

export default function NorthPage() {
  return <NorthWatch className={`${body.variable} ${mono.variable}`} />;
}
