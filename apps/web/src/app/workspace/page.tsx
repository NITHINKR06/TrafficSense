import Link from "next/link";
import { requireViewer } from "@/lib/auth/server";
import { SignOut } from "@/components/sign-out";
import { JourneyManager } from "@/components/journeys/journey-manager";
import { getCommuterJourneys, getAvailableOrganisations } from "@/lib/journeys/server";

const ROLE_LABELS: Record<string, string> = {
  commuter: "Commuter",
  employer: "Employer",
  authority: "Authority",
  admin: "Admin",
};

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

  const roleTitle = ROLE_LABELS[viewer.role] ?? viewer.role;
  const roleInitial = roleTitle.charAt(0).toUpperCase();
  const primaryHref =
    viewer.role === "authority"
      ? "/authority"
      : viewer.role === "employer"
      ? "/employer"
      : viewer.role === "admin"
      ? "/admin"
      : "/planner";
  const primaryLabel =
    viewer.role === "authority"
      ? "Open Authority Portal"
      : viewer.role === "employer"
      ? "View Organisations"
      : viewer.role === "admin"
      ? "Open Admin Console"
      : "Start journey";

  return (
    <div className="w-full max-w-[1384px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start gap-4">
      {/* Left Column: Dark Profile Card (YouWeb.html) */}
      <aside className="flex flex-col gap-3">
        <section className="rounded-[44px] bg-[#11141A] text-[#F3EFE6] p-8 shadow-[0_24px_60px_rgba(17,20,26,0.18)]">
          <span
            className="w-24 h-24 rounded-full bg-[#D5F75A] text-[#11141A] flex items-center justify-center font-display font-bold text-[44px]"
            aria-hidden="true"
          >
            {roleInitial}
          </span>

          <h1 className="mt-[22px] mb-0 font-display font-bold text-[44px] leading-[0.95] tracking-[-0.04em] text-[#F3EFE6]">
            {roleTitle}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="h-[26px] px-3 rounded-full bg-[#2A303C] text-[#F3EFE6] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
              ROLE · {viewer.role}
            </span>
          </div>

          <p className="account-email text-sm text-[#B9BDC6] mt-3 mb-0 truncate">
            {viewer.email}
          </p>

          <div className="mt-6 px-[18px] py-4 rounded-[26px] bg-[#1B2029] flex items-center gap-3.5">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="#D5F75A"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
              aria-hidden="true"
            >
              <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            </svg>
            <span className="text-base font-semibold leading-snug text-[#F3EFE6]">
              You control who sees your status
            </span>
          </div>

          <Link
            href={primaryHref}
            prefetch={viewer.role === "commuter" ? undefined : false}
            className="mt-4 h-16 rounded-full bg-[#FF5B2E] text-[#11141A] flex items-center justify-center gap-2.5 text-[18px] font-bold no-underline hover:brightness-95 transition"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            {primaryLabel}
          </Link>

          <SignOut fullWidth />
        </section>

        {process.env.DEMO_MODE === "true" && (
          <p className="notice text-xs m-0">
            SIMULATED demo accounts. Authentication and access checks use the local Supabase service.
          </p>
        )}
      </aside>

      {/* Right Column: Journeys / Role Overview + Plan / Map / Report tiles below */}
      <div className="flex flex-col gap-6 min-w-0">
        {viewer.role === "commuter" ? (
          <section className="rounded-[40px] bg-white border border-[#EEE9DC] p-6 sm:p-8 shadow-[0_12px_28px_rgba(17,20,26,0.05)]">
            <JourneyManager journeys={journeys} organisations={organisations} initialCorridor={initialCorridor} />
          </section>
        ) : (
          <section className="rounded-[40px] bg-white border border-[#EEE9DC] p-6 sm:p-8 shadow-[0_12px_28px_rgba(17,20,26,0.05)] space-y-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A505C]">
              ACCOUNT WORKSPACE
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-[-0.03em] text-[#11141A] m-0">
              Ready to jump in<span className="text-[#FF5B2E]">.</span>
            </h2>
            <p className="text-sm text-[#4A505C] m-0 max-w-xl leading-relaxed">
              Use your primary role console on the left, or open the route planner, live traffic map, or incident reporter below.
            </p>
          </section>
        )}

        {/* Bottom-Right Quick Action Tiles (Plan, Map, Report) placed below journeys/past locations */}
        <div className="grid grid-cols-3 gap-2.5">
          <Link
            href="/planner"
            className="h-[110px] rounded-[30px] bg-white border border-[#EEE9DC] flex flex-col items-center justify-center gap-2 text-sm font-bold text-[#11141A] no-underline hover:bg-[#FAF7F0] transition"
          >
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="#11141A"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
            </svg>
            Plan
          </Link>

          <Link
            href="/traffic"
            className="h-[110px] rounded-[30px] bg-white border border-[#EEE9DC] flex flex-col items-center justify-center gap-2 text-sm font-bold text-[#11141A] no-underline hover:bg-[#FAF7F0] transition"
          >
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="#11141A"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20" />
            </svg>
            Map
          </Link>

          <Link
            href="/report"
            className="h-[110px] rounded-[30px] bg-white border border-[#EEE9DC] flex flex-col items-center justify-center gap-2 text-sm font-bold text-[#11141A] no-underline hover:bg-[#FAF7F0] transition"
          >
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="#FF5B2E"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Report
          </Link>
        </div>
      </div>
    </div>
  );
}
