"use client";

import Link from "next/link";

export interface TopBarViewer {
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  commuter: "Commuter",
  employer: "Employer",
  authority: "Authority",
  admin: "Admin",
};

export function TopBar({ viewer }: { viewer: TopBarViewer | null }) {
  const roleLabel = viewer ? ROLE_LABELS[viewer.role] ?? "Account" : null;
  const roleInitial = roleLabel ? roleLabel.charAt(0).toUpperCase() : "A";
  const accountHref =
    viewer?.role === "authority"
      ? "/authority"
      : viewer?.role === "employer"
      ? "/employer"
      : viewer?.role === "admin"
      ? "/admin"
      : "/workspace";
  const alertsHref = viewer?.role === "authority" ? "/authority" : "/traffic";

  return (
    <header className="ts-topbar">
      <Link href="/" className="ts-brand-pill" aria-label="TrafficSense Mangaluru Home">
        <span className="ts-brand-disc" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="#11141A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12h4l2-4 4 8 2-4h6" />
          </svg>
        </span>
        <span className="ts-brand-wordmark">TrafficSense</span>
        <span className="ts-brand-city">MANGALURU</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "none" }}>
        <Link
          href="/demo"
          className="ts-demo-chip-desktop"
          style={{
            height: "36px",
            padding: "0 14px",
            borderRadius: "18px",
            background: "rgba(255,255,255,.86)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,.75)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "#11141A",
            textDecoration: "none",
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF5B2E" }}
          />
          DEMO DATA
        </Link>

        <Link
          href={alertsHref}
          aria-label="Alerts"
          className="relative w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-full bg-white/86 backdrop-blur-lg border border-white/75 shadow-[0_8px_22px_rgba(17,20,26,0.12)] flex items-center justify-center text-[#11141A] no-underline"
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />
          </svg>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "12px",
              right: "13px",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#FF5B2E",
              border: "2px solid #fff",
            }}
          />
        </Link>

        {viewer ? (
          <Link
            href={accountHref}
            prefetch={false}
            aria-label={`Account (${roleLabel})`}
            className="h-11 sm:h-[52px] p-1 sm:pl-5 sm:pr-2 rounded-full bg-[#11141A] text-[#F3EFE6] flex items-center gap-3 font-semibold text-[15px] shadow-[0_8px_22px_rgba(17,20,26,0.2)] no-underline"
          >
            <span className="hidden sm:inline">{roleLabel}</span>
            <span
              className="w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full bg-[#D5F75A] text-[#11141A] flex items-center justify-center font-display font-bold text-[17px]"
            >
              {roleInitial}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="h-11 sm:h-[52px] px-5 sm:px-[22px] rounded-full bg-[#11141A] text-[#F3EFE6] flex items-center gap-2 font-semibold text-sm sm:text-[15px] shadow-[0_8px_22px_rgba(17,20,26,0.2)] no-underline whitespace-nowrap"
          >
            <span>Sign in</span>
          </Link>
        )}
      </div>
    </header>
  );
}
