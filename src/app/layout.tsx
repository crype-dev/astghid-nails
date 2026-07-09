import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astghid Nails | Onglerie premium à Gilly",
  description:
    "Salon de nails à Gilly : pose gel, semi-permanent, retouches, nail art et rendez-vous en ligne.",
  openGraph: {
    title: "Astghid Nails",
    description:
      "Onglerie premium à Gilly avec tarifs clairs et réservation en ligne.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
