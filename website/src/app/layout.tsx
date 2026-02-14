import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Pitch Partner — Sponsorship Management for Professional Sports",
  description:
    "The all-in-one platform that connects professional sports clubs with their sponsors. Manage partnerships, contracts, activations, and ROI — all in one place.",
  keywords: [
    "sports sponsorship",
    "partnership management",
    "sports tech",
    "sponsor CRM",
    "sponsorship platform",
    "sports marketing",
  ],
  openGraph: {
    title: "Pitch Partner — Where Sports Clubs Meet Their Sponsors",
    description:
      "The all-in-one sponsorship management platform for professional sports organizations.",
    type: "website",
    locale: "en_US",
    siteName: "Pitch Partner",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch Partner — Sponsorship Management Platform",
    description:
      "Manage partnerships, contracts, activations, and ROI — all in one place.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className="antialiased">
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
