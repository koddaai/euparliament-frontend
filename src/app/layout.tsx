import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EU Parliament Monitor | Track MEPs in Real-Time",
  description: "Monitor Members of the European Parliament with real-time data on political groups, countries, and membership changes. Updated daily.",
  keywords: ["European Parliament", "MEPs", "EU", "politics", "members", "political groups"],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: "EU Parliament Monitor",
    description: "Track Members of the European Parliament in real-time. News, social media, and membership changes.",
    type: "website",
    siteName: "EU Parliament Monitor",
    images: [
      {
        url: '/opengraph-image.svg',
        width: 1200,
        height: 630,
        alt: 'EU Parliament Monitor - Track MEPs in Real-Time',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EU Parliament Monitor',
    description: 'Track Members of the European Parliament in real-time',
    images: ['/opengraph-image.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}
