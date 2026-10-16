"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapInstance, Marker } from "maplibre-gl";
import type { TrafficFixture } from "@/lib/traffic/simulator";
import type { PublicReport } from "@/lib/reports/rules";
import { episodeSummary } from "@/lib/traffic/presentation";
import type { AssessmentView } from "@/lib/evidence/assessment";
import type { SlowdownView } from "@/lib/evidence/slowdown-presentation";
import type { TraversalView } from "@/lib/traffic/phase4-presentation";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./traffic.module.css";

type MapProps = { fixture: TrafficFixture; reports: PublicReport[]; assessments: Record<string, AssessmentView>; slowdowns: Record<string, SlowdownView>;
  episodeCounts: Record<string, number>; lifecycleLabels: Record<string, string>; traversalViews: Record<string, TraversalView>;
  selectedId: string | null; onSelect: (id: string) => void };

export function TrafficMap(props: MapProps) {
  const [attempt, setAttempt] = useState(0);
  const geometryKey = JSON.stringify(props.fixture.segments.map(({ id, name, direction, geometry }) => ({ id, name, direction, geometry })));
  return <MapAttempt key={`${attempt}:${geometryKey}`} {...props} geometryKey={geometryKey} onRetry={() => setAttempt(value => value + 1)} />;
}

function MapAttempt({ fixture, reports, assessments, slowdowns, episodeCounts, lifecycleLabels, traversalViews, geometryKey, selectedId, onSelect, onRetry }: MapProps & { geometryKey: string; onRetry: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markers = useRef<Marker[]>([]);
  const selection = useRef(selectedId);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [failure, setFailure] = useState<"timeout" | "resources" | "renderer" | "initialization" | null>(null);
  useEffect(() => {
    selection.current = selectedId;
    const map = mapRef.current;
    if (map?.getLayer("selected-segment")) map.setFilter("selected-segment", ["==", ["get", "id"], selectedId ?? ""]);
    for (const marker of markers.current) {
      const button = marker.getElement();
      button.setAttribute("aria-pressed", String(button.dataset.mapSegment === selectedId));
    }
  }, [selectedId]);

  useEffect(() => {
    for (const marker of markers.current) {
      const button = marker.getElement();
      const segment = fixture.segments.find(row => row.id === button.dataset.mapSegment);
      const view = segment && assessments[segment.id];
      const slowdown = segment && slowdowns[segment.id];
      if (!segment || !view || !slowdown) continue;
      const count = reports.filter(report => report.segment_id === segment.id).length;
      button.dataset.reportCount = String(count);
      const countBadge = button.querySelector<HTMLElement>("[data-report-badge]");
      if (countBadge) { countBadge.textContent = String(count); countBadge.hidden = count === 0; }
      button.dataset.assessmentState = view.state;
      button.dataset.slowdownState = slowdown.state;
      button.dataset.episodeCount = String(episodeCounts[segment.id]);
      const label = `Select ${segment.name}, ${segment.direction}, simulated; ${button.dataset.reportCount} unconfirmed demo reports, including stale reports. ${episodeSummary(episodeCounts[segment.id])}. ${view.label}. ${slowdown.label} ${slowdown.windowLabel} ${lifecycleLabels[segment.id]}. ${traversalViews[segment.id].label}`;
      button.dataset.lifecycleLabel = lifecycleLabels[segment.id];
      button.dataset.delayState = traversalViews[segment.id].state;
      button.setAttribute("aria-label", label);
      button.title = label;
      const badge = button.querySelector<HTMLElement>("[data-evidence-badge]");
      if (badge) {
        badge.textContent = view.state === "multiple" ? "L3" : view.state === "expired" ? "↻" : "";
        badge.hidden = view.state === "insufficient";
      }
      const slowdownBadge = button.querySelector<HTMLElement>("[data-slowdown-badge]");
      if (slowdownBadge) {
        slowdownBadge.textContent = slowdown.state === "supported" ? "L4" : "↻";
        slowdownBadge.hidden = slowdown.state !== "supported" && slowdown.state !== "expired";
      }
    }
  }, [assessments, slowdowns, episodeCounts, lifecycleLabels, traversalViews, fixture, reports, state]);

  useEffect(() => {
    const segments = JSON.parse(geometryKey) as Pick<TrafficFixture["segments"][number], "id" | "name" | "direction" | "geometry">[];
    let disposed = false;
    let failed = false;
    let map: MapInstance | null = null;
    const fail = (reason: "timeout" | "resources" | "renderer" | "initialization") => {
      if (disposed || failed) return;
      failed = true;
      clearTimeout(deadline);
      setFailure(reason);
      setState("failed");
      mapRef.current = null;
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      map?.remove();
      map = null;
    };
    const deadline = setTimeout(() => fail("timeout"), 20000);
    async function initialize() {
      try {
        const { Map, Marker, NavigationControl, setWorkerUrl } = await import("maplibre-gl");
        if (disposed || failed || !container.current) return;
        setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
        map = new Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [74.85, 12.88], zoom: 13,
          minZoom: 11, maxZoom: 17,
          maxBounds: [[74.79, 12.82], [74.92, 12.94]],
          attributionControl: false, dragRotate: false, pitchWithRotate: false,
          touchPitch: false, cooperativeGestures: true,
        });
        mapRef.current = map;
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");
        map.on("error", () => fail("resources"));
        map.getCanvas().addEventListener("webglcontextlost", () => fail("renderer"));
        map.once("load", () => {
          if (disposed || failed || !map) return;
          map.addSource("synthetic-segments", {
            type: "geojson",
            data: { type: "FeatureCollection", features: segments.map(segment => ({
              type: "Feature", id: segment.id,
              properties: { id: segment.id, direction: segment.direction, alternative: segment.id.startsWith("alternative-") },
              geometry: segment.geometry,
            })) },
          });
          map.addLayer({ id: "segment-lines", type: "line", source: "synthetic-segments", paint: {
            "line-color": ["case", ["==", ["get", "direction"], "inbound"], "#904d00", ["get", "alternative"], "#6616d7", "#005c55"],
            "line-width": 5,
            "line-offset": ["case", ["==", ["get", "direction"], "inbound"], 8, 0],
          } });
          map.addLayer({ id: "selected-segment", type: "line", source: "synthetic-segments",
            filter: ["==", ["get", "id"], selection.current ?? ""], paint: { "line-color": "#131b2e", "line-width": 3, "line-dasharray": [2, 2],
              "line-offset": ["case", ["==", ["get", "direction"], "inbound"], 8, 0],
            },
          });
          for (const [index, segment] of segments.entries()) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = styles.marker;
            button.textContent = String(index + 1);
            button.dataset.mapSegment = segment.id;
            button.setAttribute("aria-label", `Select ${segment.name}, ${segment.direction}, simulated; evidence loading`);
            const countBadge = document.createElement("span");
            countBadge.className = styles.markerCount;
            countBadge.dataset.reportBadge = "";
            countBadge.hidden = true;
            countBadge.setAttribute("aria-hidden", "true");
            button.append(countBadge);
            const evidenceBadge = document.createElement("span");
            evidenceBadge.className = styles.markerEvidence;
            evidenceBadge.dataset.evidenceBadge = "";
            evidenceBadge.setAttribute("aria-hidden", "true");
            evidenceBadge.hidden = true;
            button.append(evidenceBadge);
            const slowdownBadge = document.createElement("span");
            slowdownBadge.className = styles.markerSlowdown;
            slowdownBadge.dataset.slowdownBadge = "";
            slowdownBadge.setAttribute("aria-hidden", "true");
            slowdownBadge.hidden = true;
            button.append(slowdownBadge);
            button.setAttribute("aria-pressed", String(selection.current === segment.id));
            button.addEventListener("click", () => onSelect(segment.id));
            const marker = new Marker({ element: button, offset: segment.direction === "inbound" ? [44, 0] : [0, 0] })
              .setLngLat(segment.geometry.coordinates[Math.floor(segment.geometry.coordinates.length / 2)])
              .addTo(map);
            markers.current.push(marker);
          }
          map.on("click", "segment-lines", event => {
            const id = event.features?.[0]?.properties.id;
            if (typeof id === "string" && segments.some(segment => segment.id === id)) onSelect(id);
          });
          map.fitBounds([[74.839, 12.87], [74.86, 12.89]], { padding: 65, animate: false });
          map.once("idle", () => {
            if (disposed || failed) return;
            clearTimeout(deadline);
            setState("ready");
          });
        });
      } catch {
        fail("initialization");
      }
    }
    void initialize();
    return () => {
      disposed = true;
      clearTimeout(deadline);
      for (const marker of markers.current) marker.remove();
      markers.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [geometryKey, onSelect]);

  return (
    <div data-map-state={state} data-map-failure={failure ?? undefined} className={styles.mapRegion}>
      <p role="status">{state === "loading" ? "Loading external background map… The segment list remains available."
        : state === "failed" ? "Map unavailable. The provider, network or WebGL could not load this view. The segment list and details remain available."
        : "Map loaded · SIMULATED segment overlay"}</p>
      {state === "failed" && <button type="button" className="button secondary" onClick={onRetry}>Retry map</button>}
      <div ref={container} className={styles.mapCanvas} style={state === "failed" ? { display: "none" } : undefined}
        role="region" aria-label="Optional map with synthetic segment selection" />
      <p>Teal: primary · Violet: fixed alternative · Brown: opposite direction. Dashed line and pressed marker: selected segment. Marker numbers match the list. Small badges count unconfirmed demo reports, including stale and repeated-source reports; colours and counts are not congestion evidence. L3 badges mean at least three eligible reporting sources as of the data read, not independent witnesses or confirmed congestion. L4 badges mean simulated slowdown support from the stated sample window, not confirmed congestion or cause. A ↻ badge means the corresponding assessment needs refresh; loss of a badge does not mean clearance.</p>
      <div className={styles.attribution} aria-label="Map attribution">
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
        <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
        <a href="/map-notices.txt" target="_blank" rel="noreferrer">Map licenses and notices</a>
      </div>
    </div>
  );
}
