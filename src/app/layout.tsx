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

const description =
  "Ink2Insight builds AI systems that turn documents into knowledge: RAG at scale on Arabic and multilingual archives, OCR, metadata extraction, document parsing, deep research and citation indexing.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ink2insight.com"),
  title: "Ink2Insight | From ink to insight",
  description,
  keywords: [
    "Arabic RAG",
    "Arabic OCR",
    "metadata extraction",
    "document parsing",
    "citation index",
    "deep research",
    "AI consulting",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Ink2Insight",
    title: "Ink2Insight | From ink to insight",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ink2Insight | From ink to insight",
    description,
  },
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
