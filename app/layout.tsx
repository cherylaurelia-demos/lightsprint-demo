import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Lightsprint plugin: /lightsprint:ask on a fresh install (unofficial demo)",
  description:
    "A fresh README install gets skills from main and the June v0.6.4 CLI, so /lightsprint:ask fails, and lightsprint upgrade unhooks the plugin. A small patch with a test. Unofficial demo by Cheryl Aurelia.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
