import { Archivo, JetBrains_Mono } from "next/font/google";
import SiteMenu from "@/components/SiteMenu";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata = {
  title: "buildbyshivam",
  description:
    "Frontend developer shipping fast, animated websites in React, Next.js, Shopify and GSAP.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >

      <head>

        <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-59LX8583"></script>
        <script>

          {`
       window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
      `}

        </script>
      </head>


      <body className="min-h-full flex flex-col">
        {children}
        <SiteMenu />
      </body>
    </html>
  );
}
