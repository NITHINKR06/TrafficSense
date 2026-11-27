import type { Metadata } from "next";
import Link from "next/link";
import { WebReportScreen } from "@/components/reports/web-report-screen";
import { getViewer } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Report Traffic Incident · TrafficSense Mangaluru",
  description:
    "Report road hazards, accidents, flooding, and traffic obstacles. Dispatched to the Civic Traffic Authority dashboard for verification.",
};

export default async function ReportPage() {
  const viewer = await getViewer();
  return (
    <div className="space-y-6">
      <div className="rounded-[36px] bg-white border border-[#EEE9DC] p-7 lg:p-9 shadow-[0_12px_28px_rgba(17,20,26,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B2E]" />
            CITIZEN HAZARD REPORTING
          </span>
          <span className="simulated-pill">COMMUNITY EVIDENCE</span>
        </div>

        <h1 className="font-display font-bold text-4xl lg:text-[52px] leading-[0.95] tracking-[-0.04em] mt-4 mb-0 text-[#11141A]">
          Report a road problem<span className="text-[#FF5B2E]">.</span>
        </h1>
        <p className="text-sm lg:text-base text-[#4A505C] mt-3 max-w-2xl mb-0">
          Your report starts at L1, positions on the Mangaluru road network, and queues in the Civic Traffic Authority
          control room for verification.
        </p>
      </div>

      <WebReportScreen viewer={viewer ? { email: viewer.email ?? "", role: viewer.role } : null} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#4A505C] px-2">
        <div className="flex flex-wrap items-center gap-4">
          <Link className="font-semibold text-[#11141A] hover:underline no-underline" href="/traffic">
            ← Live traffic map
          </Link>
          <Link className="font-semibold text-[#11141A] hover:underline no-underline" href="/planner">
            Route planner →
          </Link>
          <Link className="text-[#4A505C] hover:underline no-underline" href="/authority" prefetch={false}>
            Authority civic review
          </Link>
        </div>
        <span className="font-mono text-[11px]">TrafficSense Mangaluru · OpenStreetMap SDK</span>
      </div>
    </div>
  );
}
