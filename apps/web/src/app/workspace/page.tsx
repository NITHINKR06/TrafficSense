import Link from "next/link";
import { requireViewer } from "@/lib/auth/server";
import { SignOut } from "@/components/sign-out";
import { JourneyManager } from "@/components/journeys/journey-manager";
import { getCommuterJourneys, getAvailableOrganisations } from "@/lib/journeys/server";

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<{ corridor?: string | string[] }>;
}) {
  const viewer = await requireViewer();
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialCorridor =
    typeof resolvedParams?.corridor === "string" ? resolvedParams.corridor.slice(0, 120) : undefined;

  const journeys = viewer.role === "commuter" ? await getCommuterJourneys(viewer.supabase) : [];
  const organisations = viewer.role === "commuter" ? await getAvailableOrganisations(viewer.supabase) : [];

  return (
    <div className="space-y-6">
      {/* Profile Hero Card */}
      <section className="rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-8 lg:p-10 shadow-[0_24px_60px_rgba(17,20,26,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="h-[28px] px-3 rounded-full bg-[#1B2029] text-[#D5F75A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
            ROLE: {viewer.role}
          </span>
          <span className="h-[28px] px-3 rounded-full bg-[#2A303C] text-[#B9BDC6] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
            PRIVACY-FIRST ACCOUNT
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-4xl lg:text-[52px] leading-[0.95] tracking-[-0.04em] m-0">
              Your account<span className="text-[#D5F75A]">.</span>
            </h1>
            <p className="account-email text-sm lg:text-base text-[#B9BDC6] mt-2 mb-0">
              Signed in as <strong className="text-[#F3EFE6]">{viewer.email}</strong>
            </p>
          </div>
          <SignOut />
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-[#2A303C]">
          <div className="p-4 rounded-[24px] bg-[#1B2029]">
            <dt className="font-mono text-[10px] text-[#B9BDC6] uppercase tracking-[0.08em]">Assigned role</dt>
            <dd className="font-display text-lg font-bold capitalize mt-1 text-[#F3EFE6]">{viewer.role}</dd>
          </div>
          <div className="p-4 rounded-[24px] bg-[#1B2029]">
            <dt className="font-mono text-[10px] text-[#B9BDC6] uppercase tracking-[0.08em]">Location privacy</dt>
            <dd className="font-display text-lg font-bold mt-1 text-[#D5F75A]">
              You control who sees your status
            </dd>
          </div>
        </dl>
      </section>

      {process.env.DEMO_MODE === "true" && (
        <p className="notice text-xs m-0">
          SIMULATED demo accounts. Authentication and access checks use the local Supabase service.
        </p>
      )}

      {viewer.role === "commuter" && (
        <section className="rounded-[36px] bg-white border border-[#EEE9DC] p-7 lg:p-8 shadow-[0_12px_28px_rgba(17,20,26,0.05)]">
          <JourneyManager journeys={journeys} organisations={organisations} initialCorridor={initialCorridor} />
        </section>
      )}

      <section className="rounded-[36px] bg-white border border-[#EEE9DC] p-7 lg:p-8 space-y-4">
        <h2 className="font-display text-xl font-bold m-0 text-[#11141A]">Quick jump</h2>
        <div className="flex flex-wrap gap-2.5">
          <Link className="ts-btn-ink" href="/planner">
            Plan Route
          </Link>
          <Link className="ts-btn-ghost" href="/traffic">
            Live Traffic Map
          </Link>
          <Link className="ts-btn-primary" href="/report">
            Report Hazard
          </Link>
          {viewer.role === "employer" && (
            <Link className="ts-btn-ghost" href="/employer" prefetch={false}>
              View Organisations
            </Link>
          )}
          {viewer.role === "authority" && (
            <Link className="ts-btn-ghost" href="/authority" prefetch={false}>
              Open Authority Portal
            </Link>
          )}
          {viewer.role === "admin" && (
            <Link className="ts-btn-ghost" href="/admin" prefetch={false}>
              Open Admin Console
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
