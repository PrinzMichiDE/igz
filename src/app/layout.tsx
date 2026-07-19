import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME || "IGZ Vergleich",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || "IGZ"}`,
  },
  description:
    "Unabhängige Amazon-Produktvergleiche und Testberichte mit redaktionellen Scores.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
