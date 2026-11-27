import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { AuthorityDashboard } from "@/components/analytics/authority-dashboard";

export default async function AuthorityPage() {
  await requireRole("authority");

  return (
    <div data-fullscreen="true" className="w-full flex-1 flex flex-col space-y-6">
      {/* Control Room Header */}
      <div className="rounded-[36px] bg-[#11141A] text-[#F3EFE6] p-7 lg:p-9 shadow-[0_24px_60px_rgba(17,20,26,0.18)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-[26px] px-3 rounded-full bg-[#1B2029] text-[#D5F75A] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
              Civic Operations &amp; Intelligence
            </span>
            <span className="h-[26px] px-3 rounded-full bg-[#FF5B2E] text-[#11141A] inline-flex items-center font-mono text-[10px] font-bold tracking-[0.08em]">
              CIVIC AUTHORITY
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-[48px] leading-[0.96] tracking-[-0.04em] m-0">
            Mangaluru Control Room<span className="text-[#D5F75A]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#B9BDC6] mt-2 mb-0">
            Real-time decision support, arterial corridor congestion rankings, and citizen incident verification console.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            className="h-11 px-5 rounded-full bg-[#1B2029] text-[#F3EFE6] border border-[#2A303C] inline-flex items-center text-xs font-semibold no-underline hover:bg-[#2A303C]"
            href="/workspace"
            prefetch={false}
          >
            ← My Account
          </Link>
          <Link
            className="h-11 px-5 rounded-full bg-[#D5F75A] text-[#11141A] inline-flex items-center text-xs font-bold no-underline hover:opacity-90"
            href="/traffic"
          >
            Live Traffic Map ↗
          </Link>
        </div>
      </div>

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
