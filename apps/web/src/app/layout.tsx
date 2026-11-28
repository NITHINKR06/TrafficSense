import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopBar } from "@/components/layout/top-bar";
import { TopBarWithViewer, DockWithViewer } from "@/components/layout/viewer-chrome";
import { MotionLayer } from "@/components/layout/motion-layer";
import { TrafficSenseLoader } from "@/components/ui/trafficsense-loader";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrafficSense Mangaluru — Roads, right now.",
  description:
    "Explore TrafficSense Mangaluru: community-reported road problems, L1–L6 verification ladder, route detour alerts, and civic hotspot analytics. Public preview with optional accounts.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&family=JetBrains+Mono:wght@500;600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Suspense fallback={<TopBar viewer={null} />}>
          <TopBarWithViewer />
        </Suspense>
        <Suspense
          fallback={
            <main id="main" className="site-main" tabIndex={-1}>
              <TrafficSenseLoader />
            </main>
          }
        >
          <AppShell>{children}</AppShell>
        </Suspense>
        <Suspense fallback={null}>
          <DockWithViewer />
        </Suspense>
        <Suspense fallback={null}>
          <MotionLayer />
        </Suspense>
        <Script src="/vendor/gsap.min.js" strategy="afterInteractive" />
        <Script src="/vendor/DrawSVGPlugin.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
