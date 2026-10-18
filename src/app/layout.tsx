import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "TrafficSense Mangaluru — Traffic project preview",
  description: "Explore a traffic project for Mangaluru: planned reporting, evidence, route alerts and analysis. Public preview with optional accounts; no live traffic or location collection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="header-inner">
            <div className="brand-group">
              <Link className="brand" href="/">
                <span>TrafficSense</span>
                <span className="brand-badge">Mangaluru</span>
              </Link>
              <span className="simulated-pill header-preview-label">Development preview</span>
            </div>
            <nav aria-label="Main navigation">
              <Link href="/">Home</Link>
              <Link href="/planner">Route planner</Link>
              <Link href="/demo">Guest preview</Link>
              <Link href="/workspace" prefetch={false}>My account</Link>
            </nav>
          </div>
        </header>
        <main id="main" className="site-main" tabIndex={-1}>
          <Suspense fallback={<p role="status" className="panel">Loading…</p>}>
            {children}
          </Suspense>
        </main>
        <footer className="site-footer">
          <div>
            <strong>TrafficSense Mangaluru</strong> · REPORT → VERIFY → ALERT → ANALYSE
          </div>
          <div>Demo with simulated data. Not an official traffic service.</div>
        </footer>
      </body>
    </html>
  );
}
