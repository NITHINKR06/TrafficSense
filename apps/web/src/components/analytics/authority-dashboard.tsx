"use client";

import { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import {
  computeAnalytics,
  computeRecurrenceHeatmap,
  computeRecurrenceStatement,
  computeCauseDelaySummary,
} from "@/lib/analytics/metrics";
import { MANGALURU_JUNCTIONS, HISTORICAL_INCIDENTS, type HistoricalIncident } from "@/lib/analytics/history";
import { findNearestPreset } from "@/lib/routing/presets";
import { HotspotMap } from "@/components/analytics/hotspot-map";
import { IncidentReviewPanel } from "@/components/analytics/incident-review-panel";
import { RefreshIcon, ClockIcon, AlertTriangleIcon, MapIcon } from "@/components/icons/ui-icons";

/* ───────────── data helpers (logic unchanged) ───────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function suggestedInvestigation(cause: string): string {
  if (/waterlogging|flood/i.test(cause)) return "Inspect drainage and flood-response readiness around the reported corridor.";
  if (/maintenance|road repair/i.test(cause)) return "Coordinate works scheduling and safe diversion signage with the road-maintenance team.";
  if (/collision|accident/i.test(cause)) return "Review junction operations, conflict points, and emergency-response access with the competent authority.";
  if (/closure|restriction/i.test(cause)) return "Confirm closure controls, public notices, and an appropriate signed diversion.";
  return "Collect a longer observation window before commissioning a traffic-engineering investigation.";
}

const JUNCTION_COORDS: Record<string, [number, number]> = {
  hampankatta: [12.868, 74.842],
  "ksrtc-bejai": [12.885, 74.848],
  "jyothi-ambedkar": [12.871, 74.845],
  ladyhill: [12.894, 74.841],
  pumpwell: [12.858, 74.862],
};

function nearestJunction(lat: number, lng: number) {
  let best: (typeof MANGALURU_JUNCTIONS)[number] = MANGALURU_JUNCTIONS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const junction of MANGALURU_JUNCTIONS) {
    const [jLat, jLng] = JUNCTION_COORDS[junction.id];
    const dLat = lat - jLat;
    const dLng = (lng - jLng) * Math.cos((jLat * Math.PI) / 180);
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = junction;
    }
  }
  return best;
}

function liveCategoryToCause(category: string): HistoricalIncident["cause"] {
  switch (category) {
    case "accident":
      return "accident";
    case "road_repair":
    case "road_closed":
    case "bridge_maintenance":
      return "road_repair";
    case "heavy_traffic":
    case "heavy_volume":
      return "heavy_volume";
    case "flood":
    case "heavy_rain":
      return "flood";
    default:
      return "unknown";
  }
}

/* ───────────── design tokens (from Authority.html) ─────────────
   ink #11141A · bone #F3EFE6 · orange #FF5B2E · lime #D5F75A · muted #4A505C · hairline #EEE9DC */

const mono = "font-mono text-[11px] font-semibold uppercase tracking-[0.08em]";
const h2 = "font-display text-2xl font-bold tracking-[-0.02em] text-[#11141A] m-0 ad-rise";
const pillBtn =
  "h-12 px-[22px] rounded-full bg-white text-[#11141A] text-[15px] font-semibold inline-flex items-center gap-2.5 cursor-pointer";

const CSS = `
@keyframes ad-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes ad-dock{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
.ad-rise{animation:ad-rise .8s cubic-bezier(.22,1,.36,1) both}
.ad-dock{animation:ad-dock .8s cubic-bezier(.22,1,.36,1) .15s both}
.ad-shell a,.ad-shell button{transition:transform .35s cubic-bezier(.4,0,.2,1),box-shadow .35s ease,background-color .35s ease}
.ad-shell a:active,.ad-shell button:active{transform:scale(.97)}
@media (prefers-reduced-motion:reduce){.ad-rise,.ad-dock{animation:none}.ad-shell *{transition:none!important}}
`;

function Ico({ children, size = 22, sw = 2 }: { children: ReactNode; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      {children}
    </svg>
  );
}

const heatColor = (count: number, max: number) => {
  if (count === 0) return "#F3EFE6";
  const t = count / max;
  return t <= 0.34 ? "#F4DCCD" : t <= 0.67 ? "#F7A27F" : "#FF5B2E";
};

type DashboardTab = "operations" | "analytics" | "audit";

/* ───────────── component ───────────── */

export function AuthorityDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedJunction, setSelectedJunction] = useState("all");
  const [showDemoHistory, setShowDemoHistory] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [liveIncidents, setLiveIncidents] = useState<HistoricalIncident[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("operations");

  const refreshLiveIncidents = useCallback(() => {
    return fetch("/api/incidents", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.incidents)) {
          const mapped: HistoricalIncident[] = data.incidents.map((live: {
            id: string; category: string; first_reported_at: string; lat: number; lng: number; level: string; provenance: string;
          }) => {
            const cause = liveCategoryToCause(live.category);
            const junction = nearestJunction(live.lat, live.lng);
            const date = new Date(live.first_reported_at);
            const hour = date.getUTCHours();
            let peak_window: HistoricalIncident["peak_window"] = "off_peak";
            if (hour >= 8 && hour < 10) peak_window = "08:00-10:00";
            else if (hour >= 12 && hour < 14) peak_window = "12:00-14:00";
            else if (hour >= 17 && hour < 19) peak_window = "17:00-19:00";
            return {
              id: live.id,
              junction_id: junction.id,
              junction_name: junction.name,
              segment_id: junction.segment_id,
              direction: "outbound" as const,
              occurred_at: live.first_reported_at,
              duration_minutes: 0,
              commuter_delay_minutes: 0,
              cause,
              month: typeof live.first_reported_at === "string" ? live.first_reported_at.slice(0, 7) : "2026-10",
              peak_window,
              provenance: "reported" as const,
              lat: Number.isFinite(live.lat) ? live.lat : undefined,
              lng: Number.isFinite(live.lng) ? live.lng : undefined,
              level: live.level,
              landmark: findNearestPreset([live.lng, live.lat])?.name ?? junction.name,
            };
          });
          setLiveIncidents(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void refreshLiveIncidents();
    const refresh = () => void refreshLiveIncidents();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("trafficsense:incidents-changed", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    const poll = window.setInterval(refresh, 5_000);
    return () => {
      window.removeEventListener("trafficsense:incidents-changed", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(poll);
    };
  }, [refreshLiveIncidents]);

  const activeSource = useMemo(
    () => (showDemoHistory ? [...liveIncidents, ...HISTORICAL_INCIDENTS] : liveIncidents),
    [showDemoHistory, liveIncidents],
  );
  const data = useMemo(() => computeAnalytics(selectedMonth, activeSource), [selectedMonth, activeSource]);
  const heatmap = useMemo(() => computeRecurrenceHeatmap(selectedMonth, activeSource), [selectedMonth, activeSource]);
  const recurrenceStatement = useMemo(
    () => computeRecurrenceStatement(selectedMonth, selectedJunction, activeSource),
    [selectedMonth, selectedJunction, activeSource],
  );
  const causeDelaySummary = useMemo(() => computeCauseDelaySummary(selectedMonth, activeSource), [selectedMonth, activeSource]);
  const investigation = useMemo(() => suggestedInvestigation(data.primary_cause), [data.primary_cause]);

  const hourSlots = useMemo(() => Object.keys(heatmap[0] ?? {}).sort(), [heatmap]);
  const activeSlots = useMemo(
    () => hourSlots.filter((slot) => Object.values(heatmap).some((dayRow) => (dayRow[slot] ?? 0) > 0)),
    [hourSlots, heatmap],
  );
  const heatMax = useMemo(() => {
    let m = 1;
    for (const row of Object.values(heatmap)) for (const v of Object.values(row)) m = Math.max(m, v as number);
    return m;
  }, [heatmap]);

  function exportCsv() {
    const headers = ["Incident ID", "Junction Name", "Segment ID", "Direction", "Occurred At (UTC)", "Duration (Minutes)", "Commuter Delay (Minutes)", "Cause", "Peak Window", "Provenance"];
    const rows = data.incidents.map((i) => [i.id, `"${i.junction_name}"`, i.segment_id, i.direction, i.occurred_at, i.duration_minutes, i.commuter_delay_minutes, i.cause, i.peak_window, i.provenance]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mangaluru-traffic-analytics-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const cleanCause = (s: string) => (s ?? "").replace("_", " ");
  const metric = (h: (typeof data.hotspots)[number]) => (showDemoHistory ? h.total_delay_hours : h.incident_count);
  const metricMax = Math.max(1, ...data.hotspots.map(metric));
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .format(new Date(iso)).replace(", ", " · ");

  /* ───────────── tabs & header ───────────── */

  const TABS: { id: DashboardTab; label: string; badge?: number }[] = [
    { id: "operations", label: "Live Operations", badge: liveIncidents.length },
    { id: "analytics", label: "Corridor Analytics" },
    { id: "audit", label: "Audit & Timeline", badge: data.incidents.length },
  ];

  return (
    <div className="ad-shell w-full font-[family-name:var(--font-body)] text-[#11141A] pb-16">
      <style>{CSS}</style>

      {/* Unified Control Room Command Bar */}
      <div className="rounded-[28px] bg-white/90 backdrop-blur-xl border border-[#E8E2D3] shadow-[0_10px_30px_rgba(17,20,26,0.06)] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[#F3EFE6] border border-[#E3DDCE] font-mono text-[10px] font-bold tracking-[0.08em] text-[#11141A]">
                <span className="w-2 h-2 rounded-full bg-[#FF5B2E] animate-pulse" aria-hidden="true" />
                CIVIC AUTHORITY
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#4A505C] uppercase">
                Mangaluru Corridor Dispatch
              </span>
            </div>
            <h1 className="font-display font-bold text-5xl lg:text-[56px] leading-[0.95] tracking-[-0.04em] m-0">
              Control room<span className="text-[#FF5B2E]">.</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative inline-flex items-center">
              <span className="sr-only">Analysis window</span>
              <ClockIcon size={16} className="absolute left-3.5 pointer-events-none shrink-0 text-[#4A505C]" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 rounded-full bg-[#F3EFE6] text-[#11141A] text-[13px] font-semibold pl-9 pr-5 border border-[#E3DDCE] focus:outline-none focus:ring-2 focus:ring-[#11141A] cursor-pointer">
                <option value="all">All months</option>
                <option value="2026-07">July 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-10">October 2026</option>
              </select>
            </label>

            <div role="group" aria-label="Data source" className="h-10 p-1 rounded-full bg-[#F3EFE6] border border-[#E3DDCE] inline-flex">
              {([false, true] as const).map((v) => (
                <button key={String(v)} type="button" aria-pressed={showDemoHistory === v} onClick={() => setShowDemoHistory(v)}
                  className={`px-3.5 rounded-full text-[12px] font-semibold cursor-pointer transition ${showDemoHistory === v ? "bg-[#11141A] text-[#F3EFE6] shadow-sm" : "text-[#4A505C] hover:text-[#11141A]"}`}>
                  {v ? "Live + simulated" : "Live only"}
                </button>
              ))}
            </div>

            <button type="button" aria-label="Refresh" title="Refresh live incident records" onClick={() => void refreshLiveIncidents()}
              className="w-10 h-10 rounded-full bg-[#F3EFE6] border border-[#E3DDCE] text-[#11141A] inline-flex items-center justify-center hover:bg-[#E8E2D3] cursor-pointer">
              <RefreshIcon size={17} className="shrink-0" />
            </button>

            <button type="button" onClick={exportCsv}
              className="h-10 px-4 rounded-full bg-[#11141A] text-[#F3EFE6] text-[13px] font-semibold inline-flex items-center gap-2 hover:bg-[#2A303C] cursor-pointer">
              <Ico size={16}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Ico>
              Export CSV
            </button>
          </div>
        </div>

        {/* Segmented Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EEE9DC]">
          <div role="tablist" aria-label="Control room views" className="p-1 rounded-full bg-[#F3EFE6] border border-[#E3DDCE] inline-flex flex-wrap items-center gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "operations") {
                      setTimeout(() => window.dispatchEvent(new Event("resize")), 40);
                    }
                  }}
                  className={`h-9 px-4 rounded-full text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer transition ${
                    active
                      ? "bg-[#11141A] text-[#F3EFE6] shadow-[0_4px_12px_rgba(17,20,26,0.16)]"
                      : "text-[#4A505C] hover:text-[#11141A] hover:bg-white/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.badge === "number" && (
                    <span className={`h-5 min-w-5 px-1.5 rounded-full font-mono text-[10px] font-bold inline-flex items-center justify-center ${
                      active ? "bg-[#D5F75A] text-[#11141A]" : "bg-white text-[#11141A]"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="font-mono text-[11px] font-medium text-[#4A505C] hidden sm:inline">
            Auto-syncing every 5s · Click map pin or card to focus
          </span>
        </div>
      </div>

      {showDemoHistory && (
        <div role="status" className="mt-4 rounded-[20px] bg-[#FDF0C4] text-[#6B4F00] px-5 py-3 text-xs leading-relaxed">
          <strong className={`${mono} !text-[10px] mr-2`}>SIMULATED</strong>
          Four months of synthetic incidents are shown alongside real citizen reports. It is off by default so real counts are never inflated.
        </div>
      )}

      {/* TAB 1: LIVE OPERATIONS (Full-width Map + Review Queue Side-by-Side) */}
      <div className={activeTab === "operations" ? "mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch" : "hidden"}>
        <div className="xl:col-span-8 min-w-0">
          <HotspotMap
            hotspots={data.hotspots}
            liveIncidents={data.incidents}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={(id) => {
              setSelectedIncidentId(null);
              setSelectedHotspotId(id);
            }}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => {
              setSelectedHotspotId(null);
              setSelectedIncidentId(id);
            }}
            showDemoHistory={showDemoHistory}
            showHotspotPins={showDemoHistory}
            heightClassName="h-[540px] xl:h-[calc(100dvh-305px)] min-h-[520px]"
          />
        </div>

        <div className="xl:col-span-4 min-w-0 xl:h-[calc(100dvh-305px)] min-h-[520px] flex flex-col rounded-[32px] bg-[#FAF7F0] border border-[#E8E2D3] p-4 sm:p-5 overflow-hidden">
          <IncidentReviewPanel
            selectedIncidentId={selectedIncidentId}
            selectedHotspotId={selectedHotspotId}
            onSelectIncident={(id) => {
              setSelectedHotspotId(null);
              setSelectedIncidentId(id);
            }}
            onClearSelection={() => {
              setSelectedHotspotId(null);
              setSelectedIncidentId(null);
            }}
            layoutMode="sidebar"
            showTimeline={false}
          />
        </div>
      </div>

      {/* TAB 2: CORRIDOR ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="mt-5 space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-[32px] p-[22px] h-[150px] bg-[#11141A] text-[#F3EFE6] flex flex-col justify-between">
              <div className={`${mono} text-[#B9BDC6]`}>Incidents</div>
              <div className="font-display font-bold text-[72px] leading-[0.9] tracking-[-0.05em] text-[#D5F75A]">{data.total_incidents}</div>
            </div>

            <div className="rounded-[32px] p-[22px] h-[150px] flex flex-col justify-between"
              style={{ background: "repeating-linear-gradient(135deg,#fff 0 12px,#F6F2E8 12px 24px)" }}>
              <div className={`${mono} text-[#4A505C]`}>Commuter delay</div>
              {showDemoHistory ? (
                <div className="font-display font-bold text-[34px] leading-none tracking-[-0.03em]">{data.total_delay_hours}<span className="text-lg text-[#4A505C]"> hrs</span></div>
              ) : (
                <div className="font-display font-bold text-[34px] leading-none tracking-[-0.03em] text-[#B8400F]">Not measured</div>
              )}
            </div>

            <button type="button" onClick={() => { const t = data.hotspots[0]?.junction_id; if (t) { setSelectedHotspotId(t); setActiveTab("operations"); } }}
              title="Locate on map"
              className="rounded-[32px] p-[22px] h-[150px] bg-[#FF5B2E] text-[#11141A] flex flex-col justify-between text-left cursor-pointer">
              <div className={mono}>Top hotspot · #1</div>
              <div className="font-display font-bold text-[40px] leading-none tracking-[-0.035em] truncate w-full">{data.top_hotspot || "—"}</div>
            </button>

            <div className="rounded-[32px] p-[22px] h-[150px] bg-white flex flex-col justify-between">
              <div className={`${mono} text-[#4A505C]`}>Top cause</div>
              <div className="flex items-center gap-3 font-display font-bold text-[34px] leading-none tracking-[-0.03em] capitalize">
                <AlertTriangleIcon size={34} className="shrink-0 text-[#FF5B2E]" />
                <span className="truncate">{cleanCause(data.primary_cause) || "—"}</span>
              </div>
            </div>
          </div>

          {/* Hotspot ranking + Problem report + Delay by type */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="rounded-[36px] bg-white p-6 flex flex-col" aria-label="Hotspot ranking">
              <div className="flex items-center justify-between gap-3">
                <h2 className={h2}>Hotspot ranking</h2>
                <span className={`${mono} text-[#4A505C]`}>{showDemoHistory ? "By delay hrs" : "By events"}</span>
              </div>
              <ol className="list-none m-0 p-0 mt-5 flex flex-col gap-[18px] overflow-y-auto flex-1">
                {data.hotspots.length === 0 && <li className="text-sm text-[#4A505C] py-8 text-center">No incidents in this window.</li>}
                {data.hotspots.map((h, i) => {
                  const selected = selectedHotspotId === h.junction_id;
                  return (
                    <li key={h.junction_id}>
                      <button type="button" aria-pressed={selected} onClick={() => {
                        setSelectedIncidentId(null);
                        setSelectedHotspotId(selected ? null : h.junction_id);
                        setActiveTab("operations");
                      }}
                        className={`w-full flex items-center gap-3.5 text-left cursor-pointer rounded-2xl ${selected ? "bg-[#F8F5EE] ring-8 ring-[#F8F5EE]" : ""}`}>
                        <span className={`w-10 h-10 rounded-full shrink-0 inline-flex items-center justify-center font-mono text-sm font-bold ${i === 0 ? "bg-[#FF5B2E] text-[#11141A]" : "bg-[#11141A] text-[#F3EFE6]"}`}>
                          {i + 1}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[17px] font-semibold truncate">{h.junction_name}</span>
                          <span className="block h-2 mt-2 rounded bg-[#EFEADD] overflow-hidden">
                            <span className={`block h-full rounded ${i === 0 ? "bg-[#FF5B2E]" : "bg-[#11141A]"}`}
                              style={{ width: `${Math.max(6, (metric(h) / metricMax) * 100)}%` }} />
                          </span>
                        </span>
                        <span className="font-display font-bold text-[26px] tracking-[-0.02em]">{metric(h)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="rounded-[36px] bg-white p-6" aria-label="Authority problem report">
              <div className="flex items-center justify-between gap-3">
                <h2 className={h2}>Problem report</h2>
                <span className={`${mono} text-[#4A505C]`}>Advisory</span>
              </div>
              <dl className="grid grid-cols-2 gap-2.5 mt-5 mb-0">
                {[
                  ["Priority corridor", data.top_hotspot || "—", true],
                  ["Reported cause", cleanCause(data.primary_cause) || "—", true],
                  ["Recurrence", showDemoHistory ? recurrenceStatement : "Live-only records; collect a longer time window.", false],
                  ["Delay evidence", showDemoHistory ? `${data.total_delay_hours} hrs observed` : "Not measured for live reports", false],
                ].map(([label, value, big]) => (
                  <div key={label as string} className="rounded-[22px] bg-[#F3EFE6] p-4">
                    <dt className={`${mono} !text-[10px] text-[#4A505C]`}>{label}</dt>
                    <dd className={`m-0 mt-1.5 ${big ? "font-display font-bold text-xl capitalize tracking-[-0.02em]" : "text-[13px] font-semibold leading-snug"} ${!big && String(value).startsWith("Not") ? "text-[#B8400F]" : ""}`}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 rounded-[22px] bg-[#F3EFE6] border-l-4 border-[#FF5B2E] px-4 py-3.5">
                <div className={`${mono} !text-[10px] text-[#FF5B2E]`}>Suggested investigation</div>
                <p className="text-sm text-[#4A505C] m-0 mt-1 leading-relaxed">{investigation}</p>
              </div>
            </section>

            <section className="rounded-[36px] bg-white p-6" aria-label="Delay by incident type">
              <div className="flex items-center justify-between gap-3">
                <h2 className={h2}>Delay by type</h2>
                <span className={`${mono} text-[#4A505C]`}>{causeDelaySummary.length} causes</span>
              </div>
              <div className="mt-4">
                <div className={`grid grid-cols-[1.6fr_1fr_1fr] gap-3.5 pb-2 border-b border-[#EEE9DC] ${mono} !text-[10px] text-[#4A505C]`}>
                  <span>Cause</span><span className="text-right">Incidents</span><span className="text-right">Delay hrs</span>
                </div>
                {causeDelaySummary.length === 0 && <p className="text-sm text-[#4A505C] py-6 text-center m-0">No data in this window.</p>}
                {causeDelaySummary.map((row) => (
                  <div key={row.cause} className="grid grid-cols-[1.6fr_1fr_1fr] gap-3.5 items-center h-[54px] border-b border-[#EEE9DC] last:border-0 text-[15px]">
                    <span className="font-semibold truncate">{row.label}</span>
                    <span className="text-right font-mono font-semibold text-[13px]">{row.count}</span>
                    <span className={`text-right font-semibold ${showDemoHistory ? "" : "text-[#B8400F] text-[13px]"}`}>
                      {showDemoHistory ? row.total_delay_hours : "Not measured"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Insights: recurrence + causes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="lg:col-span-7 min-w-0 rounded-[36px] bg-white p-6" aria-label="Recurrence heatmap">
              <div className="flex items-center justify-between gap-3">
                <h2 className={h2}>Recurrence</h2>
                <span className={`${mono} text-[#4A505C]`}>Simulated baseline</span>
              </div>

              {activeSlots.length === 0 ? (
                <p className="text-sm text-[#4A505C] text-center py-12 m-0">No incidents in this window yet.</p>
              ) : (
                <div className="overflow-x-auto mt-[18px]">
                  <div className="grid items-center gap-[5px]"
                    style={{ gridTemplateColumns: `44px repeat(${activeSlots.length}, minmax(30px,1fr))`, minWidth: 44 + activeSlots.length * 35 }}>
                    <div />
                    {activeSlots.map((slot) => (
                      <div key={slot} className="font-mono text-[10px] font-semibold text-[#4A505C] text-center">{slot}</div>
                    ))}
                    {DAY_LABELS.map((label, d) => (
                      <div key={label} className="contents">
                        <div className="font-mono text-[11px] font-semibold text-[#4A505C]">{label}</div>
                        {activeSlots.map((slot) => {
                          const count = (heatmap[d]?.[slot] ?? 0) as number;
                          return (
                            <div key={slot} title={`${label} ${slot}: ${count} incident${count !== 1 ? "s" : ""}`}
                              className="h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold"
                              style={{ background: heatColor(count, heatMax), color: count / heatMax > 0.67 ? "#11141A" : "#4A505C" }}>
                              {count > 0 ? count : ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-[#EEE9DC] flex flex-wrap items-center gap-3">
                <label htmlFor="junction-select" className={`${mono} !text-[10px] text-[#4A505C]`}>For</label>
                <select id="junction-select" value={selectedJunction} onChange={(e) => setSelectedJunction(e.target.value)}
                  className="h-10 rounded-full bg-[#F3EFE6] px-4 text-[13px] font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#11141A]">
                  <option value="all">All corridors</option>
                  {MANGALURU_JUNCTIONS.map((j) => (<option key={j.id} value={j.id}>{j.name}</option>))}
                </select>
                <p className="basis-full text-sm font-semibold m-0 rounded-[22px] bg-[#F3EFE6] border-l-4 border-[#FF5B2E] px-4 py-3">
                  {recurrenceStatement}
                </p>
                <p className="basis-full text-[11px] text-[#4A505C] m-0">Computed from synthetic incident timestamps in Asia/Kolkata. Decision support only.</p>
              </div>
            </section>

            <section className="lg:col-span-5 min-w-0 rounded-[36px] bg-[#11141A] text-[#F3EFE6] p-6" aria-label="Cause distribution">
              <h2 className={`${h2} !text-[#F3EFE6]`}>Causes</h2>
              <div className="flex flex-col gap-4 mt-[18px]">
                {data.cause_mix.length === 0 && <p className="text-sm text-[#B9BDC6] m-0">No data in this window.</p>}
                {data.cause_mix.map((c) => (
                  <div key={c.cause}>
                    <div className="flex justify-between text-[15px] font-semibold">
                      <span>{c.label}</span>
                      <span className="font-mono text-[#D5F75A]">{c.count} · {c.percentage}%</span>
                    </div>
                    <div className="h-2 mt-[7px] rounded bg-[#2A303C] overflow-hidden">
                      <div className="h-full rounded bg-[#D5F75A]" style={{ width: `${Math.max(c.percentage, 4)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & TIMELINE */}
      {activeTab === "audit" && (
        <div className="mt-5 space-y-5">
          <section className="rounded-[36px] bg-white p-6" aria-label="Audit log">
            <div className="flex items-center justify-between gap-3">
              <h2 className={h2}>Audit log</h2>
              <span className={`${mono} text-[#4A505C]`}>{data.incidents.length} rows · IST</span>
            </div>
            <div className="overflow-auto max-h-[560px] mt-3.5">
              <div className="min-w-[760px]">
                <div className={`sticky top-0 bg-white grid grid-cols-[150px_1.4fr_1fr_1fr_130px] gap-3.5 items-center h-10 border-b border-[#EEE9DC] ${mono} !text-[10px] text-[#4A505C]`}>
                  <span>When</span><span>Junction</span><span>Cause</span><span>Delay</span><span>Source</span>
                </div>
                {data.incidents.length === 0 && <p className="text-sm text-[#4A505C] text-center py-10 m-0">No records in this window.</p>}
                {data.incidents.map((inc) => (
                  <div key={inc.id} className="grid grid-cols-[150px_1.4fr_1fr_1fr_130px] gap-3.5 items-center h-[54px] border-b border-[#EEE9DC] last:border-0 text-[15px]">
                    <span className="font-mono text-[13px] font-semibold text-[#4A505C]">{fmtDate(inc.occurred_at)}</span>
                    <span className="font-semibold truncate">{inc.junction_name}</span>
                    <span className="capitalize truncate">{cleanCause(inc.cause)}</span>
                    <span className={`font-semibold ${inc.provenance === "simulated" ? "" : "text-[#B8400F]"}`}>
                      {inc.provenance === "simulated" ? `${inc.commuter_delay_minutes} min` : "Not measured"}
                    </span>
                    <span className={`justify-self-start h-6 px-2.5 rounded-full inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em] ${inc.provenance === "simulated" ? "bg-[#F3EFE6] text-[#4A505C]" : "bg-[#FFE3D8] text-[#8F3209]"}`}>
                      {inc.provenance.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-[#4A505C] mt-4 mb-0">
              <strong className="text-[#11141A]">Methodology.</strong> Delay metrics reflect aggregated commuter excess travel time across synthetic observation windows.
              Outputs suggest areas for investigation and traffic-light timing reviews; they do not represent confirmed accident causes or capital project mandates.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}