import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getEmployerSharedJourneys } from "@/lib/journeys/server";

export default async function OrganisationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { supabase } = await requireRole("employer");
  const { orgId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) notFound();

  const { data: org, error } = await supabase.from("organisations").select("id,name").eq("id", orgId).maybeSingle();
  if (error) throw new Error("Organisation access is unavailable.");
  if (!org) notFound();

  const sharedJourneys = await getEmployerSharedJourneys(supabase, orgId);

  return (
    <div className="max-w-[1360px] mx-auto space-y-6 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
              ORGANISATION DASHBOARD
            </span>
            <span className="h-[30px] px-3 rounded-full bg-white border border-[#EEE9DC] text-[#4A505C] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
              SIMULATED
            </span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[72px] leading-[0.9] tracking-[-0.05em] text-[#11141A] m-0">
            {org.name}<span className="text-[#FF5B2E]">.</span>
          </h1>
          <p className="text-sm text-[#4A505C] m-0 max-w-2xl">
            Active commuter journeys shared with this organisation under explicit employee consent.
          </p>
        </div>

        <div className="rounded-[36px] bg-[#11141A] text-[#F3EFE6] px-8 py-5 text-center shadow-[0_16px_36px_rgba(17,20,26,0.18)]">
          <div className="font-display font-bold text-5xl leading-none text-[#D5F75A]">
            {sharedJourneys.length}
          </div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#B9BDC6] mt-2">
            SHARING NOW
          </div>
        </div>
      </header>

      {/* Privacy Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="h-14 px-5 rounded-full bg-white border border-[#EEE9DC] text-[#11141A] font-semibold flex items-center gap-3 shadow-[0_6px_16px_rgba(17,20,26,0.04)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E5B]" />
          No GPS coordinates
        </div>
        <div className="h-14 px-5 rounded-full bg-white border border-[#EEE9DC] text-[#11141A] font-semibold flex items-center gap-3 shadow-[0_6px_16px_rgba(17,20,26,0.04)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E5B]" />
          No home address
        </div>
        <div className="h-14 px-5 rounded-full bg-white border border-[#EEE9DC] text-[#11141A] font-semibold flex items-center gap-3 shadow-[0_6px_16px_rgba(17,20,26,0.04)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E5B]" />
          No device ID
        </div>
      </div>

      <section className="rounded-[36px] bg-white border border-[#EEE9DC] p-7 lg:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold m-0 text-[#11141A]">
            Consented Employee Journeys ({sharedJourneys.length})
          </h2>
          <span className="font-mono text-[11px] text-[#4A505C]">Refresh page to sync latest updates</span>
        </div>

        {sharedJourneys.length === 0 ? (
          <div className="p-8 rounded-[28px] bg-[#F8F5EE] border border-dashed border-[#DCD5C4] text-center space-y-1">
            <p className="font-display text-base font-bold text-[#11141A] m-0">No active shared journeys</p>
            <p className="text-xs text-[#4A505C] m-0">
              No employees have currently shared active commute status with this organisation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedJourneys.map((j) => (
              <div
                key={j.journey_id}
                className="p-5 rounded-[28px] bg-[#F8F5EE] border border-[#EEE9DC] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#D5F75A] text-[#11141A]">
                      CONSENTED SHARE
                    </span>
                    <span className="text-xs font-mono text-[#4A505C]">Ref: {j.journey_id.slice(0, 8)}…</span>
                  </div>
                  <span className="text-xs font-mono text-[#4A505C]">
                    Started {new Date(j.shared_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-mono text-[10px] text-[#4A505C] uppercase block">Corridor</span>
                    <span className="font-display font-bold text-[#11141A]">{j.corridor_name}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#4A505C] uppercase block">Status</span>
                    <span className="font-display font-bold text-[#11141A]">{j.status.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#4A505C] uppercase block">Journey evidence</span>
                    <span className="font-semibold text-[#4A505C]">Not collected</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div>
        <Link className="ts-btn-ghost" href="/employer" prefetch={false}>
          ← Back to your organisations
        </Link>
      </div>
    </div>
  );
}
