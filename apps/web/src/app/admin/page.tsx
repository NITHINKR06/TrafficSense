import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { getActiveLiveIncidents } from "@/lib/incidents/server";
import { reportCategories } from "@/lib/reports/rules";
import { IncidentIcon } from "@/components/icons/incident-icons";
import { CheckCircleIcon, ClockIcon } from "@/components/icons/ui-icons";

export default async function AdminPage() {
  const { supabase } = await requireRole("admin");
  const incidents = await getActiveLiveIncidents(supabase);
  const pendingVerification = incidents.filter((i) => i.level !== "L6");

  return (
    <div className="max-w-[1360px] mx-auto space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5 pt-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
              DEMO ADMIN
            </span>
            <span className="h-[30px] px-3 rounded-full bg-white border border-[#EEE9DC] text-[#4A505C] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
              PLATFORM OVERSIGHT
            </span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[0.95] tracking-[-0.04em] text-[#11141A] mt-3.5 mb-0">
            Oversight<span className="text-[#FF5B2E]">.</span>
          </h1>
          <p className="text-sm text-[#4A505C] mt-2.5 max-w-2xl mb-0">
            Platform-level oversight of community reports, system roles, and civic verification queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/authority"
            prefetch={false}
            className="h-[52px] px-6 rounded-full bg-white text-[#11141A] border border-[#EEE9DC] shadow-[0_8px_20px_rgba(17,20,26,0.06)] inline-flex items-center gap-2.5 font-bold text-[15px] no-underline hover:bg-[#FAF7F0] transition"
          >
            Authority portal →
          </Link>
        </div>
      </header>

      {/* Role Split Architecture */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            title: "Commuter & Employee",
            desc: "Report road hazards, plan routes, and share explicit commute status.",
            tag: "COMMUTER",
          },
          {
            title: "Employer",
            desc: "View non-GPS corridor summary status explicitly shared by consenting members.",
            tag: "EMPLOYER",
          },
          {
            title: "Traffic Authority",
            desc: "Review, corroborate, confirm (L6), resolve, or reject citizen reports.",
            tag: "AUTHORITY",
          },
          {
            title: "Platform Admin",
            desc: "Supervise infrastructure, verify server roles, and monitor active queues.",
            tag: "ADMIN",
          },
        ].map((role) => (
          <div
            key={role.title}
            className="min-h-[168px] p-6 rounded-[32px] bg-white border border-[#EEE9DC] shadow-[0_10px_24px_rgba(17,20,26,0.04)] flex flex-col justify-between"
          >
            <span className="h-7 px-3 rounded-full bg-[#F3EFE6] text-[#11141A] self-start inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
              {role.tag}
            </span>
            <div className="mt-4">
              <p className="font-display font-bold text-lg text-[#11141A] m-0">{role.title}</p>
              <p className="text-xs text-[#4A505C] mt-1.5 mb-0 leading-relaxed">{role.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Incident Verification Overview */}
      <section className="rounded-[36px] bg-white border border-[#EEE9DC] p-7 lg:p-8 shadow-[0_12px_28px_rgba(17,20,26,0.05)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#11141A] m-0">
              Active Report Verification Queue
            </h2>
            <p className="text-xs text-[#4A505C] mt-1 mb-0">
              <strong>Civic Traffic Authority</strong> evaluates and confirms community reports to L6.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFE3D8] text-[#8F3209]">
              {pendingVerification.length} Pending Review
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EFF9C4] text-[#11141A]">
              {incidents.length - pendingVerification.length} L6 Confirmed
            </span>
          </div>
        </div>

        {incidents.length === 0 ? (
          <p className="text-xs text-[#4A505C] p-6 rounded-[24px] bg-[#F8F5EE] border border-dashed border-[#DCD5C4] text-center m-0">
            No active incident reports in the system.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-[#EEE9DC]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F5EE] border-b border-[#EEE9DC] text-[#4A505C] font-mono text-[10px] uppercase tracking-[0.08em]">
                  <th className="py-3 px-4">Incident</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Reports</th>
                  <th className="py-3 px-4">Coordinates</th>
                  <th className="py-3 px-4">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE9DC] bg-white">
                {incidents.map((incident) => {
                  const category = reportCategories[incident.category] ?? incident.category;
                  const isConfirmed = incident.level === "L6";
                  return (
                    <tr key={incident.id} className="text-[#11141A] hover:bg-[#F8F5EE]/60 transition-colors">
                      <td className="py-3 px-4 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <IncidentIcon category={incident.category} size={16} className="text-[#FF5B2E] shrink-0" />
                          <span>{category}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono px-2.5 py-0.5 rounded-full bg-[#11141A] text-[#D5F75A] text-[10px] font-bold">
                          {incident.level} · {incident.provenance}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">{incident.report_count}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#4A505C]">
                        {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                      </td>
                      <td className="py-3 px-4">
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E9E5B]">
                            <CheckCircleIcon size={14} className="shrink-0" />
                            <span>Authority Confirmed (L6)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F3209]">
                            <ClockIcon size={14} className="shrink-0" />
                            <span>Awaiting Authority Review</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4A505C]">
          <span>Verification decisions are executed exclusively by the Traffic Authority role.</span>
          <Link href="/authority" prefetch={false} className="ts-btn-ghost text-xs h-10 px-4">
            Open Authority Civic Portal →
          </Link>
        </div>
      </section>

      <div>
        <Link className="ts-btn-ink" href="/workspace" prefetch={false}>
          ← Back to your account
        </Link>
      </div>
    </div>
  );
}
