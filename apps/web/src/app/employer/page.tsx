import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function EmployerPage() {
  const { supabase } = await requireRole("employer");
  const { data, error } = await supabase.from("organisations").select("id,name").order("name");
  if (error) throw new Error("Organisation access is unavailable.");

  return (
    <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
      {/* Left Header Column — matched to EmployerListWeb.html */}
      <div className="lg:col-span-5 space-y-5">
        <span className="h-[34px] px-3.5 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
          ROLE · EMPLOYER
        </span>

        <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-[84px] leading-[0.88] tracking-[-0.055em] text-[#11141A] m-0">
          Your
          <br />
          organi-
          <br />
          sations<span className="text-[#FF5B2E]">.</span>
        </h1>

        <p className="text-sm text-[#4A505C] m-0 leading-relaxed max-w-md">
          Employees appear in an organisation only after they explicitly share an active commute status; membership
          never grants location access.
        </p>

        <div className="min-h-[76px] rounded-[28px] border-2 border-dashed border-[#BDB5A2] px-6 py-4 flex items-center gap-3.5 text-[#4A505C]">
          <span className="w-8 h-8 rounded-full bg-white border border-[#EEE9DC] flex items-center justify-center shrink-0 text-[#11141A] font-mono text-xs font-bold">
            0
          </span>
          <span className="text-sm font-semibold">Other organisations are not visible to you</span>
        </div>

        <div className="pt-1">
          <Link href="/workspace" prefetch={false} className="ts-btn-ghost">
            ← Back to your account
          </Link>
        </div>
      </div>

      {/* Right Organisation Cards Column */}
      <div className="lg:col-span-7 space-y-4">
        {data.length ? (
          data.map((org, idx) => (
            <Link
              key={org.id}
              href={`/employer/${org.id}`}
              className={`rounded-[40px] p-8 sm:p-10 min-h-[220px] flex items-center justify-between gap-6 no-underline transition hover:-translate-y-1 ${
                idx === 0
                  ? "bg-[#11141A] text-[#F3EFE6] shadow-[0_18px_40px_rgba(17,20,26,0.22)]"
                  : "bg-white text-[#11141A] border border-[#EEE9DC] shadow-[0_12px_28px_rgba(17,20,26,0.06)]"
              }`}
            >
              <div className="space-y-3 min-w-0">
                <span
                  className={`h-7 px-3 rounded-full inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em] ${
                    idx === 0 ? "bg-[#1B2029] text-[#D5F75A]" : "bg-[#F3EFE6] text-[#4A505C]"
                  }`}
                >
                  ORGANISATION · CONSENT ONLY
                </span>
                <div className="font-display font-bold text-3xl sm:text-4xl lg:text-[42px] leading-[1.02] tracking-[-0.03em] truncate">
                  {org.name}
                </div>
              </div>
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-lg font-bold ${
                  idx === 0 ? "bg-[#D5F75A] text-[#11141A]" : "bg-[#11141A] text-[#F3EFE6]"
                }`}
              >
                →
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-[36px] bg-white border border-[#EEE9DC] p-8 text-center">
            <p className="text-sm text-[#4A505C] m-0">No organisation memberships are assigned to this account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
