import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kumar Collection — Men's Ethnic Wear",
  description:
    "Discover men's ethnic wear, traditional Indian clothing, kurtas, sherwanis, kurta sets and occasion wear for weddings and festivals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakartaSans.variable}`}>
      <body className="font-sans antialiased text-foreground bg-background selection:bg-zinc-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}


