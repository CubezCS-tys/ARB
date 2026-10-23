import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Naskh_Arabic } from "next/font/google";
import localFont from "next/font/local";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--font-arabic",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Soltani Intelligence | Intelligence. Applied.",
  description:
    "Soltani Intelligence builds AI systems that turn documents into knowledge: RAG at scale on Arabic and multilingual archives, OCR, metadata extraction, document parsing, deep research and citation indexing.",
  keywords: [
    "Arabic RAG",
    "Arabic OCR",
    "metadata extraction",
    "document parsing",
    "citation index",
    "deep research",
    "AI consulting",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${inter.variable} ${arabic.variable} ${geistMono.variable} grain bg-ink font-sans antialiased`}
      >
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
