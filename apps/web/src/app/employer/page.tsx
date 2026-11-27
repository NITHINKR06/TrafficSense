import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function EmployerPage() {
  const { supabase } = await requireRole("employer");
  const { data, error } = await supabase.from("organisations").select("id,name").order("name");
  if (error) throw new Error("Organisation access is unavailable.");

  return (
    <div className="space-y-6">
      <section className="rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-8 lg:p-10 shadow-[0_24px_60px_rgba(17,20,26,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="h-[28px] px-3 rounded-full bg-[#1B2029] text-[#D5F75A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
            EMPLOYER DESK
          </span>
          <span className="h-[28px] px-3 rounded-full bg-[#2A303C] text-[#B9BDC6] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
            CONSENT ONLY
          </span>
        </div>
        <h1 className="font-display font-bold text-4xl lg:text-[52px] leading-[0.95] tracking-[-0.04em] mt-4 mb-0">
          Your organisations<span className="text-[#FF5B2E]">.</span>
        </h1>
        <p className="text-sm lg:text-base text-[#B9BDC6] mt-3 max-w-2xl mb-0">
          Employees appear in an organisation only after they explicitly share an active commute status; membership
          never grants location access.
        </p>
      </section>

      {data.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((org) => (
            <Link
              key={org.id}
              href={`/employer/${org.id}`}
              className="rounded-[36px] bg-white border border-[#EEE9DC] p-8 min-h-[200px] flex flex-col justify-between no-underline text-[#11141A] shadow-[0_12px_28px_rgba(17,20,26,0.05)] hover:-translate-y-1"
            >
              <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
                ORGANISATION
              </span>
              <div className="flex items-end justify-between gap-4 mt-6">
                <span className="font-display font-bold text-3xl lg:text-4xl leading-tight tracking-[-0.03em]">
                  {org.name}
                </span>
                <span className="w-12 h-12 rounded-full bg-[#11141A] text-[#F3EFE6] flex items-center justify-center shrink-0">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[36px] bg-white border border-[#EEE9DC] p-8 text-center">
          <p className="text-sm text-[#4A505C] m-0">No organisation memberships are assigned to this account.</p>
        </div>
      )}

      <div>
        <Link href="/workspace" prefetch={false} className="ts-btn-ghost">
          ← Back to your account
        </Link>
      </div>
    </div>
  );
}
