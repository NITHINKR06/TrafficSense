"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapInstance, Marker } from "maplibre-gl";
import type { TrafficFixture } from "@/lib/traffic/simulator";
import type { PublicReport } from "@/lib/reports/rules";
import { reportCategories } from "@/lib/reports/rules";
import type { LiveIncident } from "@/lib/incidents/server";
import { formatLiveIncidentTime, liveIncidentLevelLabel } from "@/lib/incidents/presentation";
import type { AssessmentView } from "@/lib/evidence/assessment";
import type { SlowdownView } from "@/lib/evidence/slowdown-presentation";
import type { TraversalView } from "@/lib/traffic/phase4-presentation";
import type { routeAlertView } from "@/lib/route-alerts/presentation";
import { createFallbackStyle } from "@/lib/traffic/mangaluru-basemap";
import { findNearestPreset } from "@/lib/routing/presets";
import { IncidentIcon, getIncidentSvgString } from "@/components/icons/incident-icons";
import { CameraIcon, CrosshairIcon, XIcon } from "@/components/icons/ui-icons";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./traffic.module.css";

type MapProps = {
  fixture: TrafficFixture;
  reports: PublicReport[];
  assessments: Record<string, AssessmentView>;
  slowdowns: Record<string, SlowdownView>;
  episodeCounts: Record<string, number>;
  lifecycleLabels: Record<string, string>;
  traversalViews: Record<string, TraversalView>;
  alertViews: Record<string, ReturnType<typeof routeAlertView>>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeLiveIncidentId?: string | null;
  onSelectLiveIncident?: (id: string | null) => void;
  onIncidentsChange?: (incidents: LiveIncident[]) => void;
};

export function TrafficMap(props: MapProps) {
  const [attempt, setAttempt] = useState(0);
  const geometryKey = JSON.stringify(props.fixture.segments.map(({ id, name, direction, geometry }) => ({ id, name, direction, geometry })));
  return <MapAttempt key={`${attempt}:${geometryKey}`} {...props} geometryKey={geometryKey} onRetry={() => setAttempt(value => value + 1)} />;
}

function MapAttempt({
  activeLiveIncidentId,
  onSelectLiveIncident,
  onIncidentsChange,
  onRetry,
}: MapProps & { geometryKey: string; onRetry: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const liveMarkers = useRef<Marker[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [failure, setFailure] = useState<"timeout" | "resources" | "renderer" | "initialization" | null>(null);
  const [liveIncidents, setLiveIncidents] = useState<LiveIncident[]>([]);
  const [liveIncidentState, setLiveIncidentState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [internalSelectedLiveIncidentId, setInternalSelectedLiveIncidentId] = useState<string | null>(null);
  const [loadedPhoto, setLoadedPhoto] = useState<{ id: string; url: string; confidence: string | null } | null>(null);

  const effectiveSelectedIncidentId = activeLiveIncidentId !== undefined ? activeLiveIncidentId : internalSelectedLiveIncidentId;
  const setIncidentSelection = useCallback((id: string | null) => {
    setInternalSelectedLiveIncidentId(id);
    onSelectLiveIncident?.(id);
  }, [onSelectLiveIncident]);

  useEffect(() => {
    if (!effectiveSelectedIncidentId) return;
    const target = liveIncidents.find((i) => i.id === effectiveSelectedIncidentId);
    if (!target || !target.has_photo || target.photo_data_url || loadedPhoto?.id === target.id) return;
    let cancelled = false;
    fetch(`/api/incidents/${encodeURIComponent(target.id)}/photo`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.ok && data.photo_data_url) {
          setLoadedPhoto({ id: target.id, url: data.photo_data_url, confidence: data.photo_confidence ?? null });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [effectiveSelectedIncidentId, liveIncidents, loadedPhoto?.id]);

  useEffect(() => {
    let disposed = false;
    async function loadLiveIncidents() {
      try {
        const response = await fetch("/api/incidents", { cache: "no-store" });
        const data = await response.json();
        if (disposed) return;
        if (!data.ok || !Array.isArray(data.incidents)) throw new Error("Incident data was unavailable");
        setLiveIncidents(data.incidents);
        setLiveIncidentState("ready");
        onIncidentsChange?.(data.incidents);
      } catch {
        if (!disposed) setLiveIncidentState("unavailable");
      }
    }
    void loadLiveIncidents();
    const refresh = window.setInterval(() => void loadLiveIncidents(), 30_000);
    return () => {
      disposed = true;
      window.clearInterval(refresh);
    };
  }, [onIncidentsChange]);
  useEffect(() => {
    if (!effectiveSelectedIncidentId || !mapRef.current) return;
    const target = liveIncidents.find(i => i.id === effectiveSelectedIncidentId);
    if (target) {
      mapRef.current.flyTo({ center: [target.lng, target.lat], zoom: 15.5, duration: 800 });
    }
  }, [effectiveSelectedIncidentId, liveIncidents]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    let disposed = false;

    const geojsonData = {
      type: "FeatureCollection" as const,
      features: liveIncidents.map((incident) => ({
        type: "Feature" as const,
        properties: {
          id: incident.id,
          category: incident.category,
          level: incident.level,
          status: incident.status,
          cleared: incident.status === "cleared",
          verified: ["L3", "L5", "L6"].includes(incident.level),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [incident.lng, incident.lat] as [number, number],
        },
      })),
    };

    const existingSource = map.getSource("live-incidents-geojson") as
      | { setData?: (data: typeof geojsonData) => void }
      | undefined;

    if (existingSource && typeof existingSource.setData === "function") {
      existingSource.setData(geojsonData);
    } else if (map.isStyleLoaded()) {
      map.addSource("live-incidents-geojson", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 44,
      });

      map.addLayer({
        id: "live-incidents-clusters",
        type: "circle",
        source: "live-incidents-geojson",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#11141A",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 30, 28],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#D5F75A",
        },
      });

      map.addLayer({
        id: "live-incidents-cluster-count",
        type: "symbol",
        source: "live-incidents-geojson",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#F3EFE6",
        },
      });

      map.addLayer({
        id: "live-incidents-points",
        type: "circle",
        source: "live-incidents-geojson",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "cleared"], true],
            5.5,
            ["==", ["get", "verified"], true],
            9,
            7.5,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "cleared"], true],
            "#6B747C",
            ["==", ["get", "level"], "L6"],
            "#D5F75A",
            "#FF5B2E",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#11141A",
        },
      });

      map.on("click", "live-incidents-clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["live-incidents-clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const coords = (features[0]?.geometry as { coordinates?: [number, number] })?.coordinates;
        const src = map.getSource("live-incidents-geojson") as {
          getClusterExpansionZoom?: (id: number) => Promise<number>;
        } | undefined;
        if (clusterId != null && coords && src?.getClusterExpansionZoom) {
          void src.getClusterExpansionZoom(Number(clusterId)).then((zoom) => {
            map.flyTo({ center: coords, zoom, duration: 500 });
          });
        }
      });

      map.on("click", "live-incidents-points", (e) => {
        const feat = e.features?.[0];
        const id = feat?.properties?.id as string | undefined;
        const coords = (feat?.geometry as { coordinates?: [number, number] })?.coordinates;
        if (id) {
          setIncidentSelection(id);
          if (coords) map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 500 });
        }
      });

      map.on("mouseenter", "live-incidents-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "live-incidents-clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "live-incidents-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "live-incidents-points", () => { map.getCanvas().style.cursor = ""; });
    }

    // Keep only 1 HTML Marker for the currently selected incident
    for (const marker of liveMarkers.current) marker.remove();
    liveMarkers.current = [];
    const selected = liveIncidents.find((i) => i.id === effectiveSelectedIncidentId);
    if (selected) {
      void import("maplibre-gl").then(({ Marker }) => {
        if (disposed || !mapRef.current) return;
        const wrapper = document.createElement("div");
        wrapper.className = styles.liveIncidentWrapper;
        wrapper.style.zIndex = "30";
        const button = document.createElement("button");
        button.type = "button";
        button.className = styles.liveIncidentMarker;
        button.dataset.selected = "true";
        button.innerHTML = getIncidentSvgString(selected.category, 16);
        wrapper.appendChild(button);
        const marker = new Marker({ element: wrapper, anchor: "center" })
          .setLngLat([selected.lng, selected.lat])
          .addTo(map);
        liveMarkers.current.push(marker);
      });
    }

    return () => {
      disposed = true;
      for (const marker of liveMarkers.current) marker.remove();
      liveMarkers.current = [];
    };
  }, [liveIncidents, state, effectiveSelectedIncidentId, setIncidentSelection]);

  useEffect(() => {
    let disposed = false;
    let failed = false;
    let fallbackUsed = false;
    let map: MapInstance | null = null;
    const fail = (reason: "timeout" | "resources" | "renderer" | "initialization") => {
      if (disposed || failed) return;
      failed = true;
      clearTimeout(deadline);
      setFailure(reason);
      setState("failed");
      mapRef.current = null;
      for (const marker of liveMarkers.current) marker.remove();
      liveMarkers.current = [];
      map?.remove();
      map = null;
    };
    const deadline = setTimeout(() => {
      if (!fallbackUsed && map) {
        fallbackUsed = true;
        try {
          map.setStyle(createFallbackStyle());
          return;
        } catch {
          // Fall through to fail if fallback style also fails
        }
      }
      fail("timeout");
    }, 15000);

    async function initialize() {
      try {
        const { Map, NavigationControl, setWorkerUrl } = await import("maplibre-gl");
        if (disposed || failed || !container.current) return;
        setWorkerUrl("/maplibre-gl-worker.mjs");
        map = new Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [74.85, 12.88], zoom: 13,
          minZoom: 11, maxZoom: 17,
          maxBounds: [[74.70, 12.75], [74.95, 13.05]],
          attributionControl: false, dragRotate: false, pitchWithRotate: false,
          touchPitch: false, cooperativeGestures: true,
        });
        mapRef.current = map;
        map.addControl(new NavigationControl({ showCompass: false }), "top-right");
        map.on("error", () => {
          if (!fallbackUsed && map) {
            fallbackUsed = true;
            try {
              map.setStyle(createFallbackStyle());
              return;
            } catch {
              // Ignore fallback error
            }
          }
        });
        map.getCanvas().addEventListener("webglcontextlost", () => fail("renderer"));
        map.once("load", () => {
          if (disposed || failed || !map) return;
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
      for (const marker of liveMarkers.current) marker.remove();
      liveMarkers.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  const selectedLiveIncident = liveIncidents.find(incident => incident.id === effectiveSelectedIncidentId) ?? null;
  const nearestPreset = selectedLiveIncident ? findNearestPreset([selectedLiveIncident.lng, selectedLiveIncident.lat]) : null;

  return (
    <div data-map-state={state} data-map-failure={failure ?? undefined} className={styles.mapRegion}>
      {state === "loading" && (
        <div className="absolute top-4 right-4 z-20 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full border border-surface-container text-xs shadow-md">
          Loading map…
        </div>
      )}
      {state === "failed" && (
        <div className="absolute top-4 right-4 z-20 bg-rose-50 text-rose-900 px-3 py-1.5 rounded-xl border border-rose-200 text-xs shadow-md flex items-center gap-2">
          <span>Map fallback active</span>
          <button type="button" className="underline font-bold" onClick={onRetry}>Retry</button>
        </div>
      )}
      {liveIncidentState === "unavailable" && (
        <div className="absolute top-4 right-4 z-20 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 text-xs shadow-md">
          Community reports temporarily unavailable
        </div>
      )}

      <div ref={container} className={styles.mapCanvas}
        role="region" aria-label="Interactive map with current community reports and synthetic segment selection" />

      {selectedLiveIncident && (
        <section className={styles.liveIncidentDetails} aria-live="polite" aria-label="Selected community report">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={styles.liveIncidentEyebrow}>COMMUNITY REPORT</p>
              <h3 className="flex items-center gap-1.5 mt-0.5">
                <IncidentIcon category={selectedLiveIncident.category} size={18} className="text-primary" />
                <span>{reportCategories[selectedLiveIncident.category] ?? selectedLiveIncident.category}</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIncidentSelection(null)}
              className="p-1 rounded hover:bg-black/5 text-surface-on-variant flex items-center justify-center"
              aria-label="Close"
            >
              <XIcon size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 my-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200">
              {selectedLiveIncident.level} · {selectedLiveIncident.report_count} report{selectedLiveIncident.report_count !== 1 ? "s" : ""}
            </span>
            {nearestPreset && (
              <span className="text-xs text-surface-on-variant font-medium">
                Near {nearestPreset.name}
              </span>
            )}
          </div>

          {(selectedLiveIncident.photo_data_url || (loadedPhoto?.id === selectedLiveIncident.id && loadedPhoto.url)) && (
            <div className="my-2 rounded-lg overflow-hidden border border-surface-container bg-surface-container-low">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedLiveIncident.photo_data_url ?? loadedPhoto?.url ?? ""}
                alt="Verified road incident evidence"
                className="w-full h-32 object-cover block"
              />
              <div className="px-2 py-1 text-[10px] font-mono bg-surface-container-highest text-surface-on flex items-center justify-between border-t border-surface-container">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <CameraIcon size={12} className="text-primary" /> BEST VERIFIED PHOTO
                </span>
                <span>{((selectedLiveIncident.photo_confidence ?? loadedPhoto?.confidence) ?? "moderate").toUpperCase()} CONFIDENCE</span>
              </div>
            </div>
          )}

          <p><strong>{liveIncidentLevelLabel(selectedLiveIncident)}.</strong></p>
          <p>Reported <time dateTime={selectedLiveIncident.first_reported_at}>{formatLiveIncidentTime(selectedLiveIncident.first_reported_at)}</time>. This is a reported incident, not a measured traffic delay.</p>

          <div className="mt-3 pt-2 border-t border-rose-200 flex items-center gap-2">
            <a
              href={`/planner?from=${encodeURIComponent(nearestPreset?.name ?? "Hampankatta Junction")}&to=KSRTC / Bejai Circle`}
              className="button text-xs py-1.5 px-3 w-full text-center font-semibold"
            >
              Plan Detour Around This →
            </a>
          </div>
        </section>
      )}

      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => mapRef.current?.flyTo({ center: [74.856, 12.870], zoom: 13, duration: 800 })}
          className="px-3 py-1.5 rounded-xl bg-surface/95 backdrop-blur border border-surface-container shadow-md text-xs font-semibold text-surface-on hover:bg-surface-container flex items-center gap-1.5"
          title="Recenter Mangaluru map"
        >
          <CrosshairIcon size={14} className="text-primary" />
          <span>Recenter</span>
        </button>
        <div className="text-[11px] bg-surface/80 backdrop-blur px-2.5 py-1 rounded-lg border border-surface-container/60 shadow-xs flex items-center gap-2 text-surface-on-variant">
          <a href="https://openfreemap.org" target="_blank" rel="noreferrer" className="hover:underline">OpenFreeMap</a>
          <span>·</span>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">© OSM</a>
          <span>·</span>
          <a href="/map-notices.txt" target="_blank" rel="noreferrer" className="hover:underline">Notices</a>
        </div>
      </div>
    </div>
  );
}
