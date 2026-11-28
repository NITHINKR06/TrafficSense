"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { TrafficSenseLoader } from "@/components/ui/trafficsense-loader";

const FULLSCREEN_ROUTES = new Set(["/traffic", "/planner"]);
const WIDE_ROUTES = new Set(["/authority"]);
const BLEED_ROUTES = new Set(["/", "/login", "/register"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.has(pathname);
  const isWide = WIDE_ROUTES.has(pathname);
  const isBleed = BLEED_ROUTES.has(pathname);

  const mainClassName = isFullscreen
    ? "site-main--fullscreen"
    : isBleed
    ? "w-full min-h-dvh pb-28"
    : isWide
    ? "site-main site-main--wide"
    : "site-main";

  return (
    <>
      <main id="main" className={mainClassName} tabIndex={-1}>
        <Suspense fallback={<TrafficSenseLoader />}>
          {children}
        </Suspense>
      </main>
      {!isFullscreen && !isBleed && (
        <footer className="site-footer">
          <div>
            <strong>TrafficSense Mangaluru</strong> · REPORT → VERIFY → ALERT → ANALYSE
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/legal#privacy" className="underline hover:text-[#11141A]">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/legal#terms" className="underline hover:text-[#11141A]">
              Terms &amp; Conditions
            </Link>
            <span aria-hidden="true">·</span>
            <span>Demo with simulated data. Not an official traffic service.</span>
          </div>
        </footer>
      )}
    </>
  );
}
