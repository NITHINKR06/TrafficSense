import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrafficSense — Account access",
  description: "TrafficSense development preview: accounts and privacy-conscious access foundations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header"><Link className="brand" href="/">TrafficSense</Link><nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/workspace" prefetch={false}>My account</Link></nav></header>
        <main id="main" className="site-main"><Suspense fallback={<p role="status" className="panel">Loading account access…</p>}>{children}</Suspense></main>
        <footer className="site-footer">REPORT → VERIFY → ALERT → ANALYSE · Development preview</footer>
      </body>
    </html>
  );
}
