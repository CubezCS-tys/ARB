import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ARB | Academic Research Benchmarking",
  description:
    "Transforming academic archives into intelligent, searchable knowledge. OCR, citation indexing, searchable PDFs, and RAG systems for universities and publishers.",
  keywords: [
    "academic research",
    "OCR",
    "citation indexing",
    "searchable PDF",
    "RAG",
    "university technology",
    "digital archives",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${geistMono.variable} font-sans antialiased noise-overlay`}
      >
        {children}
      </body>
    </html>
  );
}
