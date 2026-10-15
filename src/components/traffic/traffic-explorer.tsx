"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { reportCategories } from "@/lib/reports/rules";
import { useSearchParams } from "next/navigation";
import type { TrafficSnapshot } from "@/lib/traffic/snapshot";
import { formatTrafficTime, latestSegmentSamples, resolveSegment, snapshotFreshness } from "@/lib/traffic/presentation";
import { assessmentView } from "@/lib/evidence/assessment";
import { useAssessmentClock } from "./use-assessment-clock";
import { RefreshTraffic } from "./refresh-traffic";
import { TrafficMap } from "./traffic-map";
import styles from "./traffic.module.css";

const freshnessLabels = {
  recent: "Recent synthetic samples", stale: "Stale synthetic samples",
  future: "Future-dated samples", missing: "No samples", unknown: "Sample freshness needs refresh",
};

export function TrafficExplorer({ snapshot }: { snapshot: TrafficSnapshot }) {
  const params = useSearchParams();
  const { elapsedMs, refreshStarted } = useAssessmentClock(snapshot);
  const assessments = Object.fromEntries(snapshot.report_assessments.map(row =>
    [row.segment_id, assessmentView(row, snapshot.read_at, elapsedMs)]));
  const [mapEnabled, setMapEnabled] = useState(false);
  const freshness = (observedAt: string | null) => snapshotFreshness(observedAt, snapshot.read_at, elapsedMs);
  const sampleLabel = (observedAt: string | null) => freshnessLabels[freshness(observedAt)];
  const selectSegment = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("segment", id);
    window.history.pushState(null, "", url);
  }, []);
  const fixture = snapshot.fixture;
  if (!fixture) return (
    <div className="panel" role="status">
      <h2>No synthetic traffic data</h2>
      <p>No demonstration corridor is loaded. This does not mean roads are clear. A local operator can load a scenario; guest browsing cannot run the simulator.</p>
      {params.has("segment") && <p>The requested segment is not available in this empty dataset.</p>}
      <RefreshTraffic onRefresh={refreshStarted} />
    </div>
  );
  const selected = resolveSegment(fixture, params.getAll("segment"));
  const latest = selected ? latestSegmentSamples(fixture, selected.id) : null;
  const selectedReports = selected ? snapshot.reports.filter(report => report.segment_id === selected.id)
    .sort((a, b) => b.received_at.localeCompare(a.received_at) || a.id.localeCompare(b.id)) : [];
  return (
    <div data-testid="traffic-ready" className={styles.explorer}>
      <div className={`panel ${styles.summary}`}>
        <div>
          <h2>{fixture.corridor.name}</h2>
          <p><strong>Stored scenario: {fixture.corridor.scenario}</strong> · SIMULATED, not current road conditions</p>
          <p>{fixture.corridor.geometry_note}</p>
          <p className={styles.timestamp}>Scenario anchor: <time dateTime={fixture.corridor.anchor_at}>{formatTrafficTime(fixture.corridor.anchor_at)}</time></p>
          <p className={styles.timestamp}>Data read: <time dateTime={snapshot.read_at}>{formatTrafficTime(snapshot.read_at)}</time></p>
        </div>
        <RefreshTraffic onRefresh={refreshStarted} />
      </div>
      <div className={styles.grid}>
        <section className={`panel ${styles.list}`} aria-labelledby="segment-list-title">
          <h2 id="segment-list-title">Directed segments</h2>
          <p>Choose a segment to match its map highlight and details. Speeds are synthetic inputs, not corroborated incidents.</p>
          <ul data-segment-list>
            {fixture.segments.map((segment, index) => {
              const samples = latestSegmentSamples(fixture, segment.id);
              return <li key={segment.id}>
                <a href={`/traffic?segment=${encodeURIComponent(segment.id)}`} data-segment-id={segment.id}
                  aria-current={selected?.id === segment.id ? "true" : undefined}
                  onClick={event => {
                    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault(); selectSegment(segment.id);
                  }}>
                  <strong>{index + 1}. {segment.name}</strong>
                  <span>{segment.direction} · SIMULATED</span>
                  <span>{sampleLabel(samples.observedAt)}</span>
                  <span data-segment-report-count={segment.id}>{snapshot.reports.filter(report => report.segment_id === segment.id).length} unconfirmed demo reports, including stale reports</span>
                  <span data-segment-assessment={segment.id} data-assessment-state={assessments[segment.id].state}>{assessments[segment.id].label}</span>
                </a>
              </li>;
            })}
          </ul>
        </section>
        <div className={styles.rightColumn}>
          <section className={`panel ${styles.mapPanel}`} aria-labelledby="map-title">
            <h2 id="map-title">Optional background map</h2>
            <p>Background roads come from OpenStreetMap. Our coloured lines are schematic demonstration geometry, not surveyed road paths or navigation guidance.</p>
            {!mapEnabled ? <div className={styles.mapConsent}>
              <p>Loading the map sends map-view requests and your network address to OpenFreeMap and its delivery providers. It does not request your device location.</p>
              <a href="https://openfreemap.org/privacy/" target="_blank" rel="noreferrer">Read the map provider’s privacy policy</a>
              <button type="button" className="button" onClick={() => setMapEnabled(true)}>Load map</button>
            </div> : <>
              <button type="button" className="button secondary" onClick={() => setMapEnabled(false)}>Hide map</button>
              <TrafficMap key={snapshot.read_at} fixture={fixture} reports={snapshot.reports} assessments={assessments} selectedId={selected?.id ?? null} onSelect={selectSegment} />
            </>}
          </section>
          <section id="segment-details" data-segment-id={selected?.id ?? ""} className="panel" aria-labelledby="segment-details-title" aria-live="polite">
            {selected && latest ? <>
              <p className="simulated-pill">SIMULATED · {selected.direction}</p>
              <h2 id="segment-details-title">{selected.name}</h2>
              <p><strong>{sampleLabel(latest.observedAt)}</strong></p>
              <p>Samples are stale at twenty minutes old; future-dated samples are not current evidence. Refreshing this page does not make old observations recent.</p>
              <dl className={styles.facts}>
                <div><dt>Segment ID</dt><dd><code>{selected.id}</code></dd></div>
                <div><dt>Route membership</dt><dd>{fixture.route_segments.filter(row => row.segment_id === selected.id).map(row => fixture.routes.find(route => route.id === row.route_id)?.name).join(", ") || "Separate opposite-direction segment"}</dd></div>
                <div><dt>Assumed length</dt><dd>{selected.length_m} metres</dd></div>
                <div><dt>Assumed baseline</dt><dd>{selected.baseline_seconds} seconds</dd></div>
                <div><dt>Latest observation</dt><dd>{latest.observedAt ? <time dateTime={latest.observedAt}>{formatTrafficTime(latest.observedAt)}</time> : "Unavailable"}</dd></div>
              </dl>
              <p>{selected.baseline_label}</p>
              <h3>Latest synthetic samples</h3>
              <p>{latest.samples.length} synthetic sources at this timestamp. These are simulated devices, not independent witnesses.</p>
              {latest.samples.length ? <ul className={styles.samples}>
                {latest.samples.map(row => <li key={row.source_id}><span>{fixture.sources.find(source => source.id === row.source_id)?.label}</span><strong>{row.speed_kph} km/h</strong></li>)}
              </ul> : <p>No samples are available for this segment. Speed, delay and congestion are not inferred.</p>}
              <h3>Report-group evidence</h3>
              <p data-report-assessment={selected.id} data-assessment-state={assessments[selected.id].state}><strong>{assessments[selected.id].label}</strong></p>
              <p>SIMULATED · Reports group by this segment and direction, not by cause or a confirmed incident. Recent reports are under twenty minutes old; eligible reports are under fifteen minutes old and linked to an eligible reporting source.</p>
              <p>Each source counts once across the rolling fifteen-minute window, including repeated reports and different categories. Expired guest sources no longer qualify. L3 Multiple sources requires at least three eligible sources, not three independent witnesses.</p>
              <p>All locations are manually selected: L1 Reported, without L2 location support. Multiple sources do not confirm congestion or any reported cause. Slowdown support, recovery, measured delay and route savings are not assessed. No reports does not mean the road is clear.</p>
              <div id="segment-reports" className={styles.reports} data-report-segment={selected.id}>
                <h3>Unconfirmed demo reports</h3>
                <p>{selectedReports.length} reports for this direction. Counts include repeated-source and stale reports, not independent witnesses. No reports does not mean the road is clear.</p>
                {selectedReports.length > 10 && <p>Showing the ten most recently received reports.</p>}
                {selectedReports.length ? <ul>
                  {selectedReports.slice(0, 10).map(report => <li key={report.id} data-public-report={report.id}>
                    <strong>{reportCategories[report.category]} — reported, unconfirmed</strong>
                    <span>SIMULATED · Manually selected location · L1 Reported</span>
                    <span>{freshness(report.observed_at) === "unknown" ? "Report freshness needs refresh" : freshness(report.observed_at) === "recent" ? "Recent report" : freshness(report.observed_at) === "future" ? "Future-dated report" : "Stale report"}</span>
                    <span>Observed: <time dateTime={report.observed_at}>{formatTrafficTime(report.observed_at)}</time></span>
                    <span>Received: <time dateTime={report.received_at}>{formatTrafficTime(report.received_at)}</time></span>
                  </li>)}
                </ul> : <p>No demo reports are stored for this segment.</p>}
                {snapshot.reporting_enabled ? <Link className="button" href={`/reports/new?segment=${encodeURIComponent(selected.id)}`}>Report a simulated problem</Link>
                  : <p>Demo reporting is disabled. Browsing remains available.</p>}
              </div>
            </> : <>
              <h2 id="segment-details-title">Segment not found</h2>
              <p>The requested segment is not in this snapshot, or the URL contains multiple segment selections. Choose a segment from the list.</p>
            </>}
          </section>
        </div>
      </div>
    </div>
  );
}
