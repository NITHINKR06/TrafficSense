"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { computeIncidentConfidence } from "../../../../../packages/shared/src/index";
import { reportCategories } from "@/lib/reports/rules";
import { IncidentIcon } from "@/components/icons/incident-icons";
import { TrustMeter } from "@/components/ui/trust-meter";
import { useSearchParams } from "next/navigation";
import type { TrafficSnapshot } from "@/lib/traffic/snapshot";
import type { PublicIncident, PublicTraversal } from "@/lib/traffic/phase4";
import { incidentView, traversalView } from "@/lib/traffic/phase4-presentation";
import type { RouteAlert } from "@/lib/route-alerts/rules";
import type { RouteComparison } from "@/lib/route-alerts/snapshot";
import { routeAlertView } from "@/lib/route-alerts/presentation";
import { resolveSegment } from "@/lib/traffic/presentation";
import { assessmentView } from "@/lib/evidence/assessment";
import type { SlowdownAssessment } from "@/lib/evidence/slowdown";
import { slowdownView } from "@/lib/evidence/slowdown-presentation";
import { useAssessmentClock } from "./use-assessment-clock";
import { RefreshTraffic } from "./refresh-traffic";
import { TrafficMap } from "./traffic-map";
import type { LiveIncident } from "@/lib/incidents/server";
import { findNearestPreset } from "@/lib/routing/presets";

function parseLevelNumber(level: string): number {
  const num = Number(level.replace(/[^0-9]/g, ""));
  return Number.isFinite(num) && num >= 1 && num <= 6 ? num : 1;
}

export function TrafficExplorer({
  snapshot,
  slowdownAssessments,
  incidents,
  traversals,
  routeAlerts,
}: {
  snapshot: TrafficSnapshot;
  slowdownAssessments: SlowdownAssessment[];
  incidents: PublicIncident[];
  traversals: PublicTraversal[];
  routeComparison: RouteComparison;
  routeAlerts: RouteAlert[];
}) {
  const params = useSearchParams();
  const deadlines = useMemo(
    () => [...slowdownAssessments, ...incidents, ...traversals, ...routeAlerts],
    [slowdownAssessments, incidents, traversals, routeAlerts]
  );
  const { elapsedMs, refreshStarted } = useAssessmentClock(snapshot, deadlines);
  const alertViews = Object.fromEntries(
    routeAlerts.map((row) => [row.segment_id, routeAlertView(row, snapshot.read_at, elapsedMs)])
  );
  const incidentViews = Object.fromEntries(
    incidents.map((row) => [row.id, incidentView(row, snapshot.read_at, elapsedMs)])
  );
  const traversalViews = Object.fromEntries(
    traversals.map((row) => [row.segment_id, traversalView(row, snapshot.read_at, elapsedMs)])
  );
  const lifecycleLabels = Object.fromEntries(
    (snapshot.fixture?.segments ?? []).map((segment) => {
      const rows = incidents
        .filter((row) => row.segment_id === segment.id)
        .sort((a, b) => b.started_at.localeCompare(a.started_at));
      const current = rows.find((row) => row.is_current) ?? rows[0];
      return [segment.id, current ? incidentViews[current.id].label : "No retained incident · road status unknown"];
    })
  );
  const slowdowns = Object.fromEntries(
    slowdownAssessments.map((row) => [row.segment_id, slowdownView(row, snapshot.read_at, elapsedMs)])
  );
  const assessments = Object.fromEntries(
    snapshot.report_assessments.map((row) => [row.segment_id, assessmentView(row, snapshot.read_at, elapsedMs)])
  );
  const episodeCounts = Object.fromEntries(
    (snapshot.fixture?.segments ?? []).map((segment) => [
      segment.id,
      snapshot.incident_episodes.filter((episode) => episode.segment_id === segment.id).length,
    ])
  );
  const [directionFilter, setDirectionFilter] = useState<"all" | "outbound" | "inbound">("all");
  const selectSegment = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("segment", id);
    window.history.pushState(null, "", url);
  }, []);

  const fixture = snapshot.fixture;
  const initialIncidentId = params.get("incident");
  const [selectedLiveIncidentId, setSelectedLiveIncidentId] = useState<string | null>(initialIncidentId);
  const [liveIncidents, setLiveIncidents] = useState<LiveIncident[]>([]);
  const [incidentFilter, setIncidentFilter] = useState<"all" | "verified" | "accident" | "hazards">("all");

  const filteredIncidents = useMemo(() => {
    return liveIncidents.filter((inc) => {
      if (incidentFilter === "verified") return ["L3", "L4", "L5", "L6"].includes(inc.level);
      if (incidentFilter === "accident") return inc.category === "accident";
      if (incidentFilter === "hazards") return ["flood", "road_closed", "hazard"].includes(inc.category);
      return true;
    });
  }, [liveIncidents, incidentFilter]);

  if (!fixture) {
    return (
      <div className="panel max-w-xl mx-auto mt-32" role="status">
        <h2 className="font-display text-2xl font-bold m-0">No synthetic traffic data</h2>
        <p className="text-sm text-[#4A505C] mt-2">
          No demonstration corridor is loaded. This does not mean roads are clear. A local operator can load a scenario;
          guest browsing cannot run the simulator.
        </p>
        {params.has("segment") && (
          <p className="text-sm text-[#4A505C] mt-1">
            The requested segment is not available in this empty dataset.
          </p>
        )}
        <div className="mt-4">
          <RefreshTraffic onRefresh={refreshStarted} />
        </div>
      </div>
    );
  }

  const selected = resolveSegment(fixture, params.getAll("segment"));
  const visibleSegments = fixture.segments.filter(
    (s) => directionFilter === "all" || s.direction === directionFilter
  );

  return (
    <div data-testid="traffic-ready" className="relative w-full h-full overflow-hidden flex flex-col">
      {/* Fullscreen Map Canvas */}
      <TrafficMap
        fixture={fixture}
        reports={snapshot.reports}
        assessments={assessments}
        slowdowns={slowdowns}
        episodeCounts={episodeCounts}
        lifecycleLabels={lifecycleLabels}
        traversalViews={traversalViews}
        alertViews={alertViews}
        selectedId={selected?.id ?? null}
        onSelect={selectSegment}
        activeLiveIncidentId={selectedLiveIncidentId}
        onSelectLiveIncident={setSelectedLiveIncidentId}
        onIncidentsChange={setLiveIncidents}
      />

      {/* Floating Glass Incident Panel (Top-Left, below floating TopBar) */}
      <aside className="absolute top-[104px] left-4 lg:left-7 z-20 w-[calc(100vw-32px)] sm:w-[392px] max-h-[calc(100dvh-216px)] flex flex-col rounded-[36px] bg-[#F3EFE6]/88 backdrop-blur-2xl border border-white/80 shadow-[0_24px_60px_rgba(17,20,26,0.20)] overflow-hidden pointer-events-auto">
        <div className="p-5 pb-3.5 border-b border-[#11141A]/10">
          <div className="flex items-center justify-between gap-2">
            <span className="h-[26px] px-2.5 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B2E]" />
              LIVE · MANGALURU
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#4A505C]">
              {liveIncidents.length} INCIDENT{liveIncidents.length !== 1 ? "S" : ""}
            </span>
          </div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[#11141A] mt-2.5 mb-0">
            Live Road Feed
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5" role="tablist" aria-label="Incident filters">
            {(
              [
                { id: "all", label: `All (${liveIncidents.length})` },
                {
                  id: "verified",
                  label: `L3+ (${liveIncidents.filter((i) => ["L3", "L4", "L5", "L6"].includes(i.level)).length})`,
                },
                { id: "accident", label: "Crashes" },
                { id: "hazards", label: "Hazards" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setIncidentFilter(tab.id)}
                className={`h-8 px-3 rounded-full text-[11px] font-semibold transition whitespace-nowrap border-0 cursor-pointer ${
                  incidentFilter === tab.id
                    ? "bg-[#11141A] text-[#F3EFE6]"
                    : "bg-white/75 text-[#11141A] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Feed of DB Incidents */}
        <div className="overflow-y-auto divide-y divide-[#11141A]/10 flex-1 min-h-0" role="list">
          {filteredIncidents.length === 0 ? (
            <p className="text-xs text-[#4A505C] p-6 text-center m-0">
              No incidents match this filter.
            </p>
          ) : (
            filteredIncidents.map((inc) => {
              const preset = findNearestPreset([inc.lng, inc.lat]);
              const isSelected = inc.id === selectedLiveIncidentId;
              const lvlNum = parseLevelNumber(inc.level);
              const confidence = computeIncidentConfidence(inc);
              const badgeBg =
                inc.category === "accident"
                  ? "#FF5B2E"
                  : inc.category === "flood"
                  ? "#2B4BFF"
                  : inc.category === "road_closed"
                  ? "#11141A"
                  : "#F5B700";
              const badgeText =
                inc.category === "flood" || inc.category === "road_closed" ? "#FFFFFF" : "#11141A";

              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelectedLiveIncidentId(inc.id)}
                  className={`w-full text-left p-4 transition flex items-start gap-3 border-0 cursor-pointer ${
                    isSelected ? "bg-white/95" : "bg-transparent hover:bg-white/60"
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: badgeBg, color: badgeText }}
                  >
                    <IncidentIcon category={inc.category} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[#11141A] truncate">
                        {preset?.name ?? reportCategories[inc.category]}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#11141A] text-[#D5F75A] shrink-0">
                        {inc.level}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A505C] m-0 truncate mt-0.5">
                      {reportCategories[inc.category]} · {confidence.tierLabel} ({Math.round(confidence.score * 100)}%)
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-24">
                        <TrustMeter level={lvlNum} height={5} />
                      </div>
                      <span className="font-mono text-[10px] text-[#4A505C] truncate">
                        {confidence.explanation}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Route Planner Action */}
        <div className="p-3.5 border-t border-[#11141A]/10 bg-white/60 flex items-center gap-2">
          <Link
            href="/planner"
            className="h-10 px-4 rounded-full bg-[#11141A] text-[#F3EFE6] w-full flex items-center justify-center gap-2 text-xs font-bold no-underline hover:bg-[#2A303C]"
          >
            <span>Plan Route Around Incidents</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Collapsible Corridor Details for Tests & Operator Tools */}
        <details className="border-t border-[#11141A]/10 bg-white/40 text-xs">
          <summary className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.08em] uppercase text-[#4A505C] cursor-pointer hover:bg-white/60 flex items-center justify-between select-none">
            <span>Corridor Segments &amp; L1–L6</span>
            <span>{visibleSegments.length}</span>
          </summary>
          <div className="px-4 pb-3 pt-1 space-y-2 max-h-[180px] overflow-y-auto">
            <div className="flex items-center gap-1 text-[11px]">
              {(["all", "outbound", "inbound"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border-0 cursor-pointer capitalize ${
                    directionFilter === dir ? "bg-[#11141A] text-[#F3EFE6]" : "bg-white/80 text-[#11141A]"
                  }`}
                  onClick={() => setDirectionFilter(dir)}
                >
                  {dir === "all" ? `All (${fixture.segments.length})` : dir}
                </button>
              ))}
            </div>
            <ul data-segment-list className="space-y-1 list-none p-0 m-0">
              {visibleSegments.map((segment) => (
                <li key={segment.id}>
                  <a
                    href={`/traffic?segment=${encodeURIComponent(segment.id)}`}
                    data-segment-id={segment.id}
                    aria-current={selected?.id === segment.id ? "true" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      selectSegment(segment.id);
                    }}
                    className="block p-2 rounded-xl bg-white/70 border border-[#EEE9DC] text-[11px] text-[#11141A] no-underline hover:bg-white"
                  >
                    {segment.name} ({segment.direction})
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-1">
              <RefreshTraffic onRefresh={refreshStarted} />
            </div>
          </div>
        </details>
      </aside>
    </div>
  );
}
