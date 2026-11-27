import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works, Provenance & Validation · TrafficSense Mangaluru",
  description:
    "Trust, in six steps. See where our data comes from, how every report is checked, and who can open what.",
};

const TRUST_STEPS = [
  {
    level: "L1",
    label: "Reported",
    note: "Someone taps to flag a problem. Nothing more yet.",
    height: "34%",
    bg: "#2A303C",
    text: "#F3EFE6",
    sub: "#B9BDC6",
  },
  {
    level: "L2",
    label: "Place supported",
    note: "Their GPS is within 50 m of the spot they reported.",
    height: "46%",
    bg: "#2A303C",
    text: "#F3EFE6",
    sub: "#B9BDC6",
  },
  {
    level: "L3",
    label: "3+ people agree",
    note: "Three separate reporters, 15 minutes, one spot.",
    height: "58%",
    bg: "#2A303C",
    text: "#F3EFE6",
    sub: "#B9BDC6",
  },
  {
    level: "L4",
    label: "Slowdown seen",
    note: "Traffic on that stretch is actually moving slower.",
    height: "70%",
    bg: "#2A303C",
    text: "#F3EFE6",
    sub: "#B9BDC6",
  },
  {
    level: "L5",
    label: "Photo checked",
    note: "A photo is checked against the place, on our server.",
    height: "82%",
    bg: "#F3EFE6",
    text: "#11141A",
    sub: "#4A505C",
  },
  {
    level: "L6",
    label: "Authority confirmed",
    note: "A verified authority signs it off. The top of the ladder.",
    height: "94%",
    bg: "#D5F75A",
    text: "#11141A",
    sub: "#2A303C",
  },
] as const;

const WORKFLOW_CARDS = [
  {
    label: "REPORT",
    text: "Tap once. Pick what you see. Done in seconds.",
    discBg: "#FF5B2E",
    discBorder: "0",
    stroke: "#11141A",
    path: "M12 5v14M5 12h14",
  },
  {
    label: "VERIFY",
    text: "Rules and evidence decide the level, not opinions.",
    discBg: "#11141A",
    discBorder: "0",
    stroke: "#D5F75A",
    path: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  },
  {
    label: "ALERT",
    text: "You hear about it only if it saves you 5+ minutes.",
    discBg: "#FFFFFF",
    discBorder: "2px solid #11141A",
    stroke: "#11141A",
    path: "M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4",
  },
  {
    label: "ANALYSE",
    text: "Authorities see patterns by place and hour.",
    discBg: "#D5F75A",
    discBorder: "0",
    stroke: "#11141A",
    path: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  },
] as const;

const PROVENANCE = [
  {
    title: "Real, live data",
    tag: "● 100% REAL",
    tagBg: "#EFF9C4",
    tagText: "#11141A",
    cardBg: "#FFFFFF",
    text: "Mangaluru's actual streets, real driving routes, citizen GPS reports, spatial clustering and the Authority audit log.",
  },
  {
    title: "Free-flow estimates",
    tag: "~ ESTIMATED",
    tagBg: "#F3EFE6",
    tagText: "#11141A",
    cardBg: "#FFFFFF",
    text: "How long a trip takes on an empty road comes from typical speeds for each road type, not from tracking anyone.",
  },
  {
    title: "Demo fixtures",
    tag: "SYNTHETIC DEMO",
    tagBg: "#FFE3D8",
    tagText: "#8F3209",
    cardBg: "#FFFFFF",
    text: "The 4-month trends and corridor slowdown cohorts are made up for the demo. They sit behind toggles and are always labelled SIMULATED.",
  },
] as const;

const SOURCE_ROWS = [
  {
    subsystem: "Road network & places",
    badge: "100% REAL",
    badgeBg: "#EFF9C4",
    badgeText: "#11141A",
    source: "OpenStreetMap (ODbL)",
    href: "https://www.openstreetmap.org/copyright",
    proof: "Real Mangaluru street shapes and junction coordinates",
  },
  {
    subsystem: "Basemap & vector tiles",
    badge: "100% REAL",
    badgeBg: "#EFF9C4",
    badgeText: "#11141A",
    source: "OpenFreeMap Liberty",
    href: "https://openfreemap.org",
    proof: "Live MapLibre GL tiles drawn in /traffic and /planner",
  },
  {
    subsystem: "Turn-by-turn routing",
    badge: "100% REAL",
    badgeBg: "#EFF9C4",
    badgeText: "#11141A",
    source: "Project OSRM",
    href: "https://project-osrm.org",
    proof: "Live shortest paths, plus a check for hazards and detours near the route",
  },
  {
    subsystem: "Spatial clustering & GPS",
    badge: "100% REAL",
    badgeBg: "#EFF9C4",
    badgeText: "#11141A",
    source: "PostGIS & browser GPS",
    href: "https://postgis.net",
    proof: "100 m clustering, a 50 m GPS check for L2, and the 3-reporter, 15-minute rule for L3",
  },
  {
    subsystem: "L5 photo check",
    badge: "100% REAL",
    badgeBg: "#EFF9C4",
    badgeText: "#11141A",
    source: "Google Gemini Vision",
    href: "https://ai.google.dev",
    proof: "Photo is stripped of metadata in the browser, then checked by AI on the server",
  },
  {
    subsystem: "Authority sign-off & audit",
    badge: "100% REAL",
    badgeBg: "#EFF9C4",
    badgeText: "#11141A",
    source: "Supabase PostgreSQL",
    href: "https://supabase.com",
    proof: "Role-gated L6 confirmation and resolution, with an immutable incident_audit_log",
  },
  {
    subsystem: "4-month trends & speed drops",
    badge: "SIMULATED",
    badgeBg: "#FFE3D8",
    badgeText: "#8F3209",
    source: "Deterministic demo fixtures",
    href: "/demo",
    proof: "Kept apart behind SIMULATED badges and the Authority history toggle",
  },
] as const;

const RULES = [
  {
    title: "Rate limit and bounds",
    text: "A named account can file up to 5 reports an hour, and only inside Mangaluru.",
  },
  {
    title: "100 m anchored clustering",
    text: "Same-type reports within 100 m merge into one incident, and the pin never drifts.",
  },
  {
    title: "Sticky L3 and guarded L5",
    text: "3+ independent reporters in 15 minutes lock L3. L5 happens on the server, only after the photo check passes.",
  },
  {
    title: "Safe clearing and expiry",
    text: "3+ nearby clear votes mark a non-L6 incident cleared. Only an Authority can resolve L6. Unconfirmed reports expire after 3 hours.",
  },
] as const;

const PRIVACY = [
  {
    title: "No reporter identity leaks",
    text: "Public feeds and Authority views never see reporter emails, user IDs or device IDs.",
  },
  {
    title: "Photos are stripped first",
    text: "Images are re-encoded as compressed JPEGs in your browser, so camera GPS and EXIF data are gone before upload.",
  },
  {
    title: "No background tracking",
    text: "Location is read only when you report or plan a route. Sharing with an employer is opt-in and never uses GPS.",
  },
] as const;

const ACCESS_ROWS: { feature: string; roles: [boolean, boolean, boolean, boolean, boolean] }[] = [
  { feature: "Live map", roles: [true, true, true, true, true] },
  { feature: "Plan a route", roles: [true, true, true, true, true] },
  { feature: "Report", roles: [true, true, true, true, true] },
  { feature: "Workspace", roles: [false, true, false, false, false] },
  { feature: "Employer view", roles: [false, false, true, false, false] },
  { feature: "Control room", roles: [false, false, false, true, false] },
  { feature: "Oversight", roles: [false, false, false, false, true] },
];

function SectionLabel({ id, n, children }: { id: string; n: number; children: React.ReactNode }) {
  return (
    <div id={id} className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center justify-center font-mono text-xs font-bold">
        {n}
      </span>
      <span className="font-mono font-semibold text-xs tracking-[0.08em] text-[#4A505C] uppercase">
        {children}
      </span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-[1384px] mx-auto pt-4 pb-16 space-y-14">
      {/* Hero Header */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
            PROVENANCE &amp; VALIDATION
          </span>
          <span className="h-[30px] px-3 rounded-full bg-white border border-[#EEE9DC] text-[#4A505C] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.06em]">
            EXPLAINABLE TRUTH OVER BLIND PREDICTION
          </span>
        </div>

        <h1 className="font-display font-bold text-6xl sm:text-8xl lg:text-[116px] leading-[0.88] tracking-[-0.055em] text-[#11141A] m-0">
          Trust, in
          <br />
          six steps<span className="text-[#FF5B2E]">.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#4A505C] max-w-2xl leading-relaxed m-0 font-medium">
          Anyone can say the road is blocked. We want to know it is. So every report climbs a ladder, and
          only real evidence moves it up: nearby GPS, other people, slowing traffic, a checked photo, or an
          Authority&apos;s word. Anything simulated stays clearly labelled and kept apart.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link className="ts-btn-primary" href="/planner">
            Try the route planner →
          </Link>
          <Link className="ts-btn-ink" href="/traffic">
            Open traffic explorer
          </Link>
          <Link className="ts-btn-ghost" href="/authority">
            Authority dashboard
          </Link>
        </div>
      </header>

      {/* Rising 6-Step Trust Ladder Card */}
      <section
        aria-label="Trust ladder L1 to L6"
        className="rounded-[36px] sm:rounded-[48px] bg-[#11141A] text-[#F3EFE6] p-6 sm:p-11"
      >
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <h2 className="m-0 font-display font-bold text-3xl sm:text-5xl leading-[0.95] tracking-[-0.04em]">
            Every report earns
            <br />
            its level<span className="text-[#D5F75A]">.</span>
          </h2>
          <p className="m-0 max-w-sm text-sm text-[#B9BDC6] leading-relaxed">
            Taller means more trusted. A report never skips a step, and it can&apos;t be bought or voted up
            by one person.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end lg:h-[400px]">
          {TRUST_STEPS.map((step) => (
            <div
              key={step.level}
              style={{ background: step.bg, color: step.text, height: step.height }}
              className="min-h-[170px] lg:min-h-0 rounded-[24px] sm:rounded-[28px] p-5 flex flex-col justify-between box-border"
            >
              <span className="font-mono font-bold text-[22px] leading-none">{step.level}</span>
              <div>
                <span className="block font-display font-bold text-xl sm:text-2xl leading-[1.02] tracking-[-0.02em]">
                  {step.label}
                </span>
                <span
                  style={{ color: step.sub }}
                  className="mt-2 block text-[12px] sm:text-[13px] leading-snug font-medium"
                >
                  {step.note}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Step Flow Strip */}
      <section aria-label="Four step workflow" className="space-y-4">
        <div className="font-mono font-semibold text-xs tracking-[0.08em] text-[#4A505C] uppercase">
          THE WHOLE LOOP, IN FOUR WORDS
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {WORKFLOW_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-[32px] sm:rounded-[40px] bg-white border border-[#EEE9DC] p-6 sm:p-7 min-h-[220px] sm:min-h-[240px] flex flex-col justify-between"
            >
              <span
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{ background: card.discBg, border: card.discBorder }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  fill="none"
                  stroke={card.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={card.path} />
                </svg>
              </span>
              <div className="mt-6">
                <span className="block font-mono font-semibold text-sm tracking-[0.08em] text-[#11141A]">
                  {card.label}
                </span>
                <p className="mt-2 mb-0 text-sm text-[#4A505C] leading-snug font-medium">{card.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Provenance Trio */}
      <section aria-labelledby="provenance-title" className="space-y-4">
        <SectionLabel id="provenance-title" n={1}>
          What&apos;s real, what&apos;s estimated, what&apos;s simulated
        </SectionLabel>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROVENANCE.map((item) => (
            <div
              key={item.title}
              style={{ background: item.cardBg }}
              className="rounded-[36px] border border-[#EEE9DC] p-7 flex flex-col gap-4 min-h-[240px]"
            >
              <span
                style={{ background: item.tagBg, color: item.tagText }}
                className="self-start h-7 px-3 rounded-full inline-flex items-center font-mono text-[10px] font-bold"
              >
                {item.tag}
              </span>
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#11141A] m-0">
                {item.title}
              </h2>
              <p className="text-sm text-[#4A505C] leading-relaxed m-0 font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Authoritative Data Source & Verification Matrix */}
      <section aria-labelledby="sources-title" className="space-y-4">
        <SectionLabel id="sources-title" n={2}>
          Where every piece comes from
        </SectionLabel>

        <p className="m-0 max-w-2xl text-sm sm:text-base text-[#4A505C] leading-relaxed font-medium">
          Six of seven parts run on real, open and auditable sources. The one that doesn&apos;t is marked
          SIMULATED, in plain sight.
        </p>

        <div className="rounded-[36px] sm:rounded-[40px] bg-white border border-[#EEE9DC] px-5 sm:px-8 py-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse text-sm">
            <thead>
              <tr className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C] uppercase">
                <th className="py-3.5 pr-4">Part</th>
                <th className="py-3.5 px-4">Provenance</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 pl-4">How we check it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE9DC]">
              {SOURCE_ROWS.map((row) => (
                <tr key={row.subsystem} className="text-[#11141A]">
                  <td className="py-4 pr-4 font-semibold">{row.subsystem}</td>
                  <td className="py-4 px-4">
                    <span
                      className="h-6 px-2.5 rounded-full inline-flex items-center font-mono text-[10px] font-bold whitespace-nowrap"
                      style={{ background: row.badgeBg, color: row.badgeText }}
                    >
                      {row.badge}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {row.href.startsWith("http") ? (
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#2B4BFF] hover:underline"
                      >
                        {row.source} ↗
                      </a>
                    ) : (
                      <Link href={row.href} className="font-semibold text-[#2B4BFF] hover:underline">
                        {row.source} →
                      </Link>
                    )}
                  </td>
                  <td className="py-4 pl-4 text-sm text-[#4A505C]">{row.proof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Validation rules + Privacy */}
      <section aria-labelledby="validation-title" className="space-y-4">
        <SectionLabel id="validation-title" n={3}>
          The rules we play by
        </SectionLabel>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
          <div className="rounded-[36px] bg-white border border-[#EEE9DC] p-7 sm:p-9">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#11141A] m-0">
              How reports are validated
            </h2>
            <ol className="mt-6 mb-0 p-0 list-none flex flex-col gap-5">
              {RULES.map((rule, i) => (
                <li key={rule.title} className="flex gap-4">
                  <span className="w-9 h-9 rounded-full bg-[#F3EFE6] text-[#11141A] inline-flex items-center justify-center flex-none font-mono text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-display font-bold text-lg tracking-[-0.015em] text-[#11141A]">
                      {rule.title}
                    </div>
                    <p className="mt-1 mb-0 text-sm text-[#4A505C] leading-relaxed font-medium">{rule.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[36px] bg-[#11141A] text-[#F3EFE6] p-7 sm:p-9">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#D5F75A] m-0">
              Privacy, by design
            </h2>
            <ul className="mt-6 mb-0 p-0 list-none flex flex-col gap-5">
              {PRIVACY.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="w-2.5 h-2.5 mt-2 rounded-full bg-[#D5F75A] flex-none" />
                  <div>
                    <div className="font-display font-bold text-lg tracking-[-0.015em]">{item.title}</div>
                    <p className="mt-1 mb-0 text-sm text-[#B9BDC6] leading-relaxed font-medium">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Role Access Matrix */}
      <section aria-labelledby="access-matrix-title" className="space-y-4">
        <SectionLabel id="access-matrix-title" n={4}>
          Who can open what
        </SectionLabel>

        <p className="m-0 max-w-2xl text-sm sm:text-base text-[#4A505C] leading-relaxed font-medium">
          Everyone can see the map, plan a route and report. Deeper tools are limited to the people whose
          job needs them.
        </p>

        <div className="rounded-[32px] sm:rounded-[40px] bg-white border border-[#EEE9DC] px-5 sm:px-8 py-3 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))] items-center h-[60px] font-mono font-semibold text-xs tracking-[0.08em] text-[#4A505C]">
              <span />
              <span className="text-center">GUEST</span>
              <span className="text-center">COMMUTER</span>
              <span className="text-center">EMPLOYER</span>
              <span className="text-center">AUTHORITY</span>
              <span className="text-center">ADMIN</span>
            </div>

            {ACCESS_ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))] items-center h-[60px] border-t border-[#EEE9DC] text-base sm:text-lg font-semibold text-[#11141A]"
              >
                <span>{row.feature}</span>
                {row.roles.map((allowed, idx) => (
                  <span key={idx} className="flex justify-center">
                    {allowed ? (
                      <i className="block w-[22px] h-[22px] rounded-full bg-[#11141A]" />
                    ) : (
                      <i className="block w-2 h-2 rounded-full bg-[#DCD5C4]" />
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
          <span className="inline-flex items-center gap-2">
            <i className="block w-[14px] h-[14px] rounded-full bg-[#11141A]" /> HAS ACCESS
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="block w-2 h-2 rounded-full bg-[#DCD5C4]" /> NO ACCESS
          </span>
        </div>
      </section>

      {/* Closing band */}
      <section
        aria-label="Try it"
        className="rounded-[36px] sm:rounded-[44px] bg-[#FF5B2E] p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <h2 className="m-0 font-display font-bold text-4xl sm:text-6xl leading-[0.95] tracking-[-0.04em] text-[#11141A]">
          Don&apos;t take our word.
          <br />
          Check the road<span className="text-[#F3EFE6]">.</span>
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/traffic"
            className="h-14 px-8 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center font-bold text-base no-underline"
          >
            Open the map
          </Link>
          <Link
            href="/report"
            className="h-14 px-8 rounded-full bg-[#F3EFE6] text-[#11141A] inline-flex items-center font-bold text-base no-underline"
          >
            Report a problem
          </Link>
        </div>
      </section>

      {/* Honesty Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="h-11 px-5 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center gap-2.5 text-[15px] font-semibold">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Reroute alert only if you save 5+ min
        </span>
        <span className="h-11 px-5 rounded-full border-[1.5px] border-[#11141A] text-[#11141A] inline-flex items-center font-mono font-semibold text-xs tracking-[0.08em]">
          SIMULATED DATA
        </span>
        <span className="h-11 px-5 rounded-full bg-white border border-[#EEE9DC] text-[#11141A] inline-flex items-center text-[15px] font-semibold">
          Not an official service
        </span>
      </div>
    </div>
  );
}