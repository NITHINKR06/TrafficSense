import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { AuthorityDashboard } from "@/components/analytics/authority-dashboard";

export default async function AuthorityPage() {
  await requireRole("authority");

  return (
    <div data-fullscreen="true" className="w-full max-w-[1360px] mx-auto flex-1 flex flex-col space-y-6">
      {/* Control Room Header — matched to Authority.html */}
      <header className="flex flex-wrap items-end justify-between gap-5 pt-2">
        <div>
          <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
            CIVIC AUTHORITY
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[0.95] tracking-[-0.04em] text-[#11141A] mt-3.5 mb-0">
            Control room<span className="text-[#FF5B2E]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#4A505C] mt-2.5 mb-0 max-w-2xl">
            Real-time decision support, arterial corridor congestion rankings, and citizen incident verification console.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            className="h-12 px-5 rounded-full bg-white text-[#11141A] border border-[#EEE9DC] shadow-[0_8px_20px_rgba(17,20,26,0.06)] inline-flex items-center text-[15px] font-semibold no-underline hover:bg-[#FAF7F0] transition"
            href="/workspace"
            prefetch={false}
          >
            ← My Account
          </Link>
          <Link
            className="h-12 px-5 rounded-full bg-[#11141A] text-[#F3EFE6] shadow-[0_8px_20px_rgba(17,20,26,0.16)] inline-flex items-center text-[15px] font-semibold no-underline hover:bg-[#2A303C] transition"
            href="/traffic"
          >
            Live Traffic Map ↗
          </Link>
        </div>
      </header>

      {/* Main Executive Dashboard */}
      <AuthorityDashboard />

      {/* Methodology notice at bottom */}
      <div className="rounded-[28px] bg-white border border-[#EEE9DC] p-5 text-xs space-y-1">
        <p className="font-semibold text-[#11141A] m-0">Methodology &amp; Purpose</p>
        <p className="text-[#4A505C] m-0">
          Delay metrics reflect aggregated commuter excess travel time across synthetic observation windows. Outputs
          suggest areas for investigation and traffic light timing reviews; they do not represent confirmed accident
          causes or capital project mandates.
        </p>
      </div>
    </div>
  );
}
