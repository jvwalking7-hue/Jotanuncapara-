import localFont from "next/font/local";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Providers } from "./providers"; // Importando nosso novo arquivo
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const uberMove = localFont({
  src: [
    {
      path: "../public/fonts/UberMoveTextLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/UberMoveTextRegular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-uber-move",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-br"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, uberMove.variable, "font-sans", inter.variable)}
    >
      <body className={`min-h-full flex flex-col ${uberMove.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}