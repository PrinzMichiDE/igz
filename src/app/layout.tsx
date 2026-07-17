import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "IGZ Vergleich",
    template: "%s | IGZ Vergleich",
  },
  description:
    "Affiliate-getriebene Produktvergleiche und Testberichte für Amazon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} ${GeistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
