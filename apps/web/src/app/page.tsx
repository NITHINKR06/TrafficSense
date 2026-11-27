import Link from "next/link";
import { Suspense } from "react";
import { StylisedCityMap } from "@/components/map/stylised-city-map";
import { TrustMeter } from "@/components/ui/trust-meter";
import { createAuthClient } from "@/lib/auth/server";
import { getActiveLiveIncidents } from "@/lib/incidents/server";
import { findNearestPreset } from "@/lib/routing/presets";

async function HeroLiveWidgets() {
  let incidentCount = 0;
  let verifiedL3Count = 0;
  let photoCheckedCount = 0;
  let latestTitle = "Hampankatta Corridor";
  let latestLevel = 3;
  let latestMeta = "SIMULATED · DEMO";

  try {
    const supabase = await createAuthClient(true);
    const incidents = await getActiveLiveIncidents(supabase);
      if (incidents.length > 0) {
        incidentCount = incidents.length;
        verifiedL3Count = incidents.filter((inc) => ["L3", "L4", "L5", "L6"].includes(inc.level)).length;
        photoCheckedCount = incidents.filter(
          (inc) => ["L5", "L6"].includes(inc.level) || Boolean(inc.photo_data_url)
        ).length;
        const top = incidents[0];
        if (top) {
          const preset = findNearestPreset([top.lng, top.lat]);
          latestTitle = `${top.category.replace(/_/g, " ")} · ${preset?.name ?? "Mangaluru"}`;
          latestLevel = Number(top.level.replace(/[^0-9]/g, "")) || 1;
          latestMeta = `${top.level} · ACTIVE`;
        }
      }
  } catch {
    // Fallback to baseline demo counts if database is unavailable
  }

  return (
    <div className="lg:flex lg:items-start lg:justify-between lg:gap-8">
      <div className="lg:w-[600px] rounded-[36px] lg:rounded-[44px] bg-[#F3EFE6]/85 backdrop-blur-2xl border border-white/80 shadow-[0_24px_60px_rgba(17,20,26,0.2)] p-7 lg:p-10">
        <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
          <span className="w-[7px] h-[7px] rounded-full bg-[#FF5B2E]" />
          LIVE · MANGALURU
        </span>

        <h1 className="mt-5 mb-0 font-display font-bold text-5xl sm:text-7xl lg:text-[96px] leading-[0.9] tracking-[-0.05em]">
          Roads,
          <br />
          right now<span className="text-[#FF5B2E]">.</span>
        </h1>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/report"
            className="h-14 lg:h-[68px] px-7 lg:px-[34px] rounded-full bg-[#FF5B2E] text-[#11141A] inline-flex items-center gap-3 font-bold text-base lg:text-[20px] shadow-[0_12px_26px_rgba(255,91,46,0.4)] no-underline hover:-translate-y-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Report a problem</span>
          </Link>
          <Link
            href="/planner"
            className="h-14 lg:h-[68px] px-7 lg:px-[30px] rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center gap-3 font-bold text-base lg:text-[20px] no-underline hover:bg-[#2A303C] hover:-translate-y-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
            </svg>
            <span>Plan route</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 border-t border-[#11141A]/15 pt-5 gap-4">
          <div>
            <div className="font-display font-bold text-4xl lg:text-[48px] leading-none tracking-[-0.04em]">
              {incidentCount}
            </div>
            <div className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
              INCIDENTS
            </div>
          </div>
          <div className="border-l border-[#11141A]/15 pl-5">
            <div className="font-display font-bold text-4xl lg:text-[48px] leading-none tracking-[-0.04em]">
              {verifiedL3Count}
            </div>
            <div className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
              VERIFIED L3+
            </div>
          </div>
          <div className="border-l border-[#11141A]/15 pl-5">
            <div className="font-display font-bold text-4xl lg:text-[48px] leading-none tracking-[-0.04em]">
              {photoCheckedCount}
            </div>
            <div className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
              PHOTO CHECKED
            </div>
          </div>
        </div>
      </div>

      {/* Right Floating Widgets */}
      <div className="lg:w-[380px] mt-6 lg:mt-0 flex flex-col gap-3 z-10 shrink-0">
        <Link
          href="/planner"
          className="block rounded-[32px] bg-white/90 backdrop-blur-xl p-[22px] shadow-[0_14px_34px_rgba(17,20,26,0.16)] no-underline text-[#11141A] hover:-translate-y-0.5"
        >
          <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
            YOUR COMMUTE
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="font-display font-bold text-[22px] tracking-[-0.015em]">
              Hampankatta → KSRTC
            </div>
            <div className="font-display font-bold text-[34px] leading-none">
              5<span className="text-[15px] font-semibold"> min</span>
            </div>
          </div>
          <div className="mt-3.5 relative h-3">
            <div className="absolute left-0 right-0 top-[5px] h-[2px] bg-[#E3DDCE]" />
            <span className="absolute left-0 top-[2px] w-2 h-2 rounded-full bg-[#11141A]" />
            <span className="absolute left-[58%] -top-[1px] w-3.5 h-3.5 rounded-full bg-[#FF5B2E] border-[3px] border-white shadow-[0_0_0_1px_#FF5B2E]" />
            <span className="absolute right-0 top-[2px] w-2 h-2 rounded-full bg-[#11141A]" />
          </div>
        </Link>

        <Link
          href="/traffic"
          className="rounded-[32px] bg-[#11141A] text-[#F3EFE6] p-[22px] shadow-[0_14px_34px_rgba(17,20,26,0.3)] flex items-center gap-4 no-underline hover:-translate-y-0.5"
        >
          <span className="w-14 h-14 rounded-full bg-[#FF5B2E] flex items-center justify-center flex-none">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="#11141A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 16v-5l2-5h10l2 5v5M3 16h18M7.5 16v3M16.5 16v3" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[20px] tracking-[-0.015em] capitalize truncate">
              {latestTitle}
            </div>
            <div className="mt-2.5 w-[130px]">
              <TrustMeter level={latestLevel} dark />
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-[#B9BDC6] whitespace-nowrap">
            {latestMeta}
          </span>
        </Link>

        <Link
          href="/traffic"
          className="h-16 rounded-full bg-white/90 backdrop-blur-xl px-[26px] flex items-center justify-between font-bold text-[17px] text-[#11141A] shadow-[0_14px_34px_rgba(17,20,26,0.14)] no-underline hover:-translate-y-0.5"
        >
          <span>Open full map</span>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

const TRUST_LEVELS = [
  { code: "L1", label: "Reported", level: 1 },
  { code: "L2", label: "Place supported", level: 2 },
  { code: "L3", label: "3+ people agree", level: 3 },
  { code: "L4", label: "Slowdown seen", level: 4 },
  { code: "L5", label: "Photo matches", level: 5 },
  { code: "L6", label: "Authority confirms", level: 6 },
];

export default function Home() {
  return (
    <div className="w-full bg-[#F3EFE6] text-[#11141A]">
      {/* Hero Section */}
      <section className="relative min-h-[820px] lg:h-[900px] overflow-hidden pb-10 lg:pb-0">
        <div className="absolute inset-0">
          <StylisedCityMap />
        </div>

        <div className="relative z-10 max-w-[1384px] mx-auto px-4 lg:px-7 pt-[104px] lg:pt-[132px]">
          <Suspense
            fallback={
              <div className="lg:w-[600px] rounded-[36px] lg:rounded-[44px] bg-[#F3EFE6]/85 backdrop-blur-2xl border border-white/80 shadow-[0_24px_60px_rgba(17,20,26,0.2)] p-7 lg:p-10">
                <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#FF5B2E]" />
                  LIVE · MANGALURU
                </span>
                <h1 className="mt-5 mb-0 font-display font-bold text-5xl sm:text-7xl lg:text-[96px] leading-[0.9] tracking-[-0.05em]">
                  Roads,
                  <br />
                  right now<span className="text-[#FF5B2E]">.</span>
                </h1>
              </div>
            }
          >
            <HeroLiveWidgets />
          </Suspense>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-[1384px] mx-auto px-4 lg:px-7 pt-10 lg:pt-14 pb-20">
        {/* Trust-Ladder Bento */}
        <section aria-labelledby="trust-title" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
          <div className="rounded-[36px] lg:rounded-[44px] bg-[#11141A] text-[#F3EFE6] p-8 lg:p-11">
            <h2
              id="trust-title"
              className="m-0 font-display font-bold text-4xl lg:text-[56px] leading-[0.95] tracking-[-0.04em]"
            >
              Every report earns
              <br />
              its level<span className="text-[#D5F75A]">.</span>
            </h2>
            <div className="mt-9 flex flex-col gap-3.5">
              {TRUST_LEVELS.map((item) => (
                <div key={item.code} className="flex items-center gap-4">
                  <span className="w-10 font-mono font-bold text-base text-[#D5F75A]">{item.code}</span>
                  <span className="w-40 sm:w-[210px] text-base lg:text-[18px] font-semibold">{item.label}</span>
                  <span className="flex-1 grid grid-cols-6 gap-[5px]">
                    {[1, 2, 3, 4, 5, 6].map((seg) => (
                      <i
                        key={seg}
                        style={{
                          height: "10px",
                          borderRadius: "5px",
                          background:
                            seg <= item.level
                              ? item.level === 6
                                ? "#D5F75A"
                                : "#F3EFE6"
                              : "#2A303C",
                          display: "block",
                        }}
                      />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-[36px] lg:rounded-[44px] bg-[#FF5B2E] p-8 lg:p-9 flex flex-col justify-between min-h-[220px]">
              <span className="w-16 h-16 rounded-full bg-[#11141A] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="#F3EFE6"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7" />
                </svg>
              </span>
              <div className="mt-6 font-display font-bold text-3xl lg:text-[36px] leading-none tracking-[-0.03em] text-[#11141A]">
                Photos are checked,
                <br />
                then discarded.
              </div>
            </div>

            <div className="flex-1 rounded-[36px] lg:rounded-[44px] bg-white p-8 lg:p-9 flex flex-col justify-between min-h-[220px] border border-[#EEE9DC]">
              <span className="w-16 h-16 rounded-full bg-[#D5F75A] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="#11141A"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                </svg>
              </span>
              <div className="mt-6 font-display font-bold text-3xl lg:text-[36px] leading-none tracking-[-0.03em] text-[#11141A]">
                Only alerts that save 5+ min.
              </div>
            </div>
          </div>
        </section>

        {/* REPORT → VERIFY → ALERT → ANALYSE Strip */}
        <section
          aria-label="Core workflow"
          className="mt-10 rounded-[36px] bg-white border border-[#EEE9DC] px-6 py-8 lg:py-10 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center"
        >
          <div className="text-center">
            <span className="inline-flex w-[72px] h-[72px] rounded-full bg-[#FF5B2E] items-center justify-center">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#11141A" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <div className="mt-3.5 font-mono font-semibold text-[13px] tracking-[0.08em]">REPORT</div>
          </div>
          <div className="text-center">
            <span className="inline-flex w-[72px] h-[72px] rounded-full bg-[#11141A] items-center justify-center">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#D5F75A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
              </svg>
            </span>
            <div className="mt-3.5 font-mono font-semibold text-[13px] tracking-[0.08em]">VERIFY</div>
          </div>
          <div className="text-center">
            <span className="inline-flex w-[72px] h-[72px] rounded-full bg-[#F3EFE6] items-center justify-center">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#11141A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />
              </svg>
            </span>
            <div className="mt-3.5 font-mono font-semibold text-[13px] tracking-[0.08em]">ALERT</div>
          </div>
          <div className="text-center">
            <span className="inline-flex w-[72px] h-[72px] rounded-full bg-[#D5F75A] items-center justify-center">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#11141A" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
              </svg>
            </span>
            <div className="mt-3.5 font-mono font-semibold text-[13px] tracking-[0.08em]">ANALYSE</div>
          </div>
        </section>

        {/* Choose Your View */}
        <div className="mt-14 font-mono font-semibold text-[12px] tracking-[0.08em] text-[#4A505C]">
          CHOOSE YOUR VIEW
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/traffic"
            className="rounded-[40px] bg-white p-8 min-h-[260px] lg:min-h-[300px] flex flex-col justify-between no-underline text-[#11141A] border border-[#EEE9DC] hover:-translate-y-1"
          >
            <span className="w-16 h-16 rounded-full bg-[#F3EFE6] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#11141A" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
                <path d="M12 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </svg>
            </span>
            <div className="flex items-end justify-between">
              <span className="font-display font-bold text-3xl lg:text-[38px] leading-none tracking-[-0.03em]">
                Commuters
              </span>
              <span className="w-[52px] h-[52px] rounded-full bg-[#11141A] text-[#F3EFE6] flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>

          <Link
            href="/employer"
            prefetch={false}
            className="rounded-[40px] bg-white p-8 min-h-[260px] lg:min-h-[300px] flex flex-col justify-between no-underline text-[#11141A] border border-[#EEE9DC] hover:-translate-y-1"
          >
            <span className="w-16 h-16 rounded-full bg-[#F3EFE6] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#11141A" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
                <path d="M5 21V4h9v17M14 9h5v12M9 8h1M9 12h1M9 16h1M3 21h18" />
              </svg>
            </span>
            <div className="flex items-end justify-between">
              <span className="font-display font-bold text-3xl lg:text-[38px] leading-none tracking-[-0.03em]">
                Employers
              </span>
              <span className="w-[52px] h-[52px] rounded-full bg-[#11141A] text-[#F3EFE6] flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>

          <Link
            href="/authority"
            prefetch={false}
            className="rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-8 min-h-[260px] lg:min-h-[300px] flex flex-col justify-between no-underline hover:-translate-y-1"
          >
            <span className="w-16 h-16 rounded-full bg-[#1B2029] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#D5F75A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
              </svg>
            </span>
            <div className="flex items-end justify-between">
              <span className="font-display font-bold text-3xl lg:text-[38px] leading-none tracking-[-0.03em]">
                Authorities
              </span>
              <span className="w-[52px] h-[52px] rounded-full bg-[#D5F75A] text-[#11141A] flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        </div>

        {/* Honesty Chips */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="h-10 px-4 rounded-full border-[1.5px] border-[#11141A] inline-flex items-center font-mono text-[12px] font-semibold tracking-[0.08em]">
            SIMULATED DATA
          </span>
          <span className="h-10 px-4 rounded-full bg-white border border-[#EEE9DC] inline-flex items-center font-semibold text-sm">
            Not an official traffic service
          </span>
          <span className="h-10 px-4 rounded-full bg-white border border-[#EEE9DC] inline-flex items-center font-semibold text-sm">
            Location only when you tap
          </span>
          <Link
            href="/about"
            className="h-10 px-4 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center font-semibold text-sm no-underline hover:bg-[#2A303C]"
          >
            How it works →
          </Link>
        </div>
      </div>
    </div>
  );
}
