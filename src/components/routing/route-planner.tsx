"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import type { Map as MapInstance, Marker as MarkerInstance } from "maplibre-gl";
import { formatRouteDuration, formatRouteDistance, type RouteOption } from "@/lib/routing/types";
import { reportCategories, reportCategoryIcons, type ReportCategory } from "@/lib/reports/rules";
import type { LiveIncident } from "@/lib/incidents/server";
import { createFallbackStyle } from "@/lib/traffic/mangaluru-basemap";
import "maplibre-gl/dist/maplibre-gl.css";

export const MANGALURU_PRESETS = [
  { name: "Hampankatta Junction", coords: [74.8426, 12.8698] as [number, number] },
  { name: "KSRTC / Bejai Circle", coords: [74.8530, 12.8856] as [number, number] },
  { name: "Ambedkar (Jyothi) Circle", coords: [74.8465, 12.8715] as [number, number] },
  { name: "Ladyhill Circle", coords: [74.8385, 12.8890] as [number, number] },
  { name: "Pumpwell (Mahaveera) Circle", coords: [74.8685, 12.8550] as [number, number] },
  { name: "Mangaluru Central Railway", coords: [74.8390, 12.8640] as [number, number] },
  { name: "Kadri Manjunatha Temple", coords: [74.8580, 12.8820] as [number, number] },
  { name: "Mangalore International Airport", coords: [74.8900, 12.9610] as [number, number] },
];

export function RoutePlanner() {
  const [startIndex, setStartIndex] = useState<number>(0); // Hampankatta
  const [destIndex, setDestIndex] = useState<number>(1); // KSRTC Bejai
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [useGpsStart, setUseGpsStart] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [liveIncidents, setLiveIncidents] = useState<LiveIncident[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Incident reporting state
  const [showReportForm, setShowReportForm] = useState<boolean>(false);
  const [reportCategory, setReportCategory] = useState<ReportCategory>("accident");
  const [reportLocationIndex, setReportLocationIndex] = useState<number>(0);
  const [useGpsReport, setUseGpsReport] = useState<boolean>(false);
  const [reportNote, setReportNote] = useState<string>("");
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);

  // Get active start & destination coordinates
  const activeStart: [number, number] = useGpsStart && userLocation
    ? userLocation
    : MANGALURU_PRESETS[startIndex].coords;
  const activeDest: [number, number] = MANGALURU_PRESETS[destIndex].coords;

  // Request browser GPS position
  function handleRequestGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        setGpsAccuracy(pos.coords.accuracy);
        setUseGpsStart(true);
      },
      (err) => {
        setGpsError(`GPS fix unavailable: ${err.message}. Using preset.`);
        setUseGpsStart(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Fetch driving routes between activeStart and activeDest
  function fetchRoutes(startCoords: [number, number], destCoords: [number, number]) {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: startCoords,
            destination: destCoords,
          }),
        });

        const data = await res.json();
        if (!data.ok || !data.routes || data.routes.length === 0) {
          setStatusMessage(data.error ?? "No routes found between these locations.");
          setRoutes([]);
          setSelectedRouteId(null);
          return;
        }

        setRoutes(data.routes);
        setSelectedRouteId(data.routes[0].id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setStatusMessage(`Could not retrieve route: ${msg}`);
      }
    });
  }

  // Fetch active incidents
  async function loadIncidents() {
    try {
      const res = await fetch("/api/incidents");
      const data = await res.json();
      if (data.ok && Array.isArray(data.incidents)) {
        setLiveIncidents(data.incidents);
      }
    } catch {
      // Ignore network errors on background poll
    }
  }

  // Submit incident report
  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportFeedback(null);

    const reportCoords = useGpsReport && userLocation
      ? userLocation
      : MANGALURU_PRESETS[reportLocationIndex].coords;

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: reportCategory,
          lat: reportCoords[1],
          lng: reportCoords[0],
          gps_accuracy_m: useGpsReport ? gpsAccuracy : null,
          gps_fix_at: useGpsReport ? new Date().toISOString() : null,
          note: reportNote || null,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setReportFeedback(
          `✓ Report recorded! Incident verification level: ${data.level} (${data.level_reason}).`
        );
        setReportNote("");
        setShowReportForm(false);
        // Refresh incidents and recalculate route
        await loadIncidents();
        fetchRoutes(activeStart, activeDest);
      } else {
        setReportFeedback(`❌ Could not submit: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setReportFeedback(`❌ Submission failed: ${msg}`);
    } finally {
      setIsSubmittingReport(false);
    }
  }

  // Map rendering helper
  const renderRoutesOnMap = (
    map: MapInstance,
    routeList: RouteOption[],
    selectedId: string | null,
    incidentList: LiveIncident[]
  ) => {
    if (!map.isStyleLoaded()) {
      map.once("style.load", () => {
        renderRoutesOnMap(map, routeList, selectedId, incidentList);
      });
      return;
    }

    // Clear old markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    // Remove existing layers and sources if present
    if (map.getLayer("routes-alt-layer")) map.removeLayer("routes-alt-layer");
    if (map.getLayer("routes-primary-layer")) map.removeLayer("routes-primary-layer");
    if (map.getSource("routes-geojson")) map.removeSource("routes-geojson");

    // Build GeoJSON features for all routes
    const features = routeList.map((r) => ({
      type: "Feature" as const,
      properties: {
        id: r.id,
        is_selected: r.id === (selectedId ?? routeList[0]?.id),
        is_recommended: r.is_recommended,
        avoids_incident: r.avoids_incident,
      },
      geometry: r.geometry,
    }));

    map.addSource("routes-geojson", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features,
      },
    });

    // Layer 1: Alternative / unselected routes
    map.addLayer({
      id: "routes-alt-layer",
      type: "line",
      source: "routes-geojson",
      filter: ["!=", ["get", "id"], selectedId ?? routeList[0]?.id ?? ""],
      paint: {
        "line-color": "#64748b",
        "line-width": 4,
        "line-dasharray": [2, 2],
        "line-opacity": 0.7,
      },
    });

    // Layer 2: Selected / recommended route
    map.addLayer({
      id: "routes-primary-layer",
      type: "line",
      source: "routes-geojson",
      filter: ["==", ["get", "id"], selectedId ?? routeList[0]?.id ?? ""],
      paint: {
        "line-color": "#2563eb",
        "line-width": 6,
        "line-opacity": 0.95,
      },
    });

    // Add Start, Destination, and Incident markers
    import("maplibre-gl").then(({ Marker, LngLatBounds }) => {
      // Start Marker (Green)
      const startEl = document.createElement("div");
      startEl.className = "w-5 h-5 rounded-full bg-emerald-600 border-2 border-white shadow flex items-center justify-center text-[10px] text-white font-bold";
      startEl.textContent = "A";
      const startMarker = new Marker({ element: startEl })
        .setLngLat(activeStart)
        .addTo(map);
      markersRef.current.push(startMarker);

      // Destination Marker (Red)
      const destEl = document.createElement("div");
      destEl.className = "w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow flex items-center justify-center text-[10px] text-white font-bold";
      destEl.textContent = "B";
      const destMarker = new Marker({ element: destEl })
        .setLngLat(activeDest)
        .addTo(map);
      markersRef.current.push(destMarker);

      // Incident Markers (Emoji + Level Badge)
      for (const inc of incidentList) {
        const incEl = document.createElement("div");
        const icon = reportCategoryIcons[inc.category] ?? "⚠️";
        incEl.className = "px-1.5 py-0.5 rounded-full bg-surface-container-lowest/95 border border-surface-container shadow flex items-center gap-1 text-[11px] font-bold cursor-pointer";
        incEl.title = `${reportCategories[inc.category] ?? inc.category} (${inc.level}): ${inc.level_reason}`;
        incEl.innerHTML = `<span>${icon}</span><span class="text-[9px] px-1 rounded bg-amber-500 text-white">${inc.level}</span>`;

        const incMarker = new Marker({ element: incEl })
          .setLngLat([inc.lng, inc.lat])
          .addTo(map);
        markersRef.current.push(incMarker);
      }

      // Fit map bounds to encompass the route coordinates
      const selected = routeList.find((r) => r.id === (selectedId ?? routeList[0]?.id));
      if (selected && selected.geometry.coordinates.length > 0) {
        const bounds = new LngLatBounds();
        for (const coord of selected.geometry.coordinates) {
          bounds.extend(coord as [number, number]);
        }
        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      }
    });
  };

  // Initialize route & incidents on mount
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      try {
        const [routeRes, incidentRes] = await Promise.all([
          fetch("/api/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start: activeStart, destination: activeDest }),
          }),
          fetch("/api/incidents"),
        ]);

        const routeData = await routeRes.json();
        const incidentData = await incidentRes.json();

        if (!cancelled) {
          if (incidentData.ok && Array.isArray(incidentData.incidents)) {
            setLiveIncidents(incidentData.incidents);
          }
          if (routeData.ok && Array.isArray(routeData.routes) && routeData.routes.length > 0) {
            setRoutes(routeData.routes);
            setSelectedRouteId(routeData.routes[0].id);
          }
        }
      } catch {
        // Fallback gracefully on mount
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;
    let disposed = false;

    async function initMap() {
      const { Map, NavigationControl, AttributionControl, setWorkerUrl } = await import("maplibre-gl");
      if (disposed || !mapContainer.current) return;

      setWorkerUrl("/maplibre-gl-worker.mjs");

      let fallbackUsed = false;
      const map = new Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [74.85, 12.875],
        zoom: 12.5,
        attributionControl: false,
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");

      map.on("error", () => {
        if (!fallbackUsed && map) {
          fallbackUsed = true;
          try {
            map.setStyle(createFallbackStyle());
          } catch {
            // Ignore fallback error
          }
        }
      });

      map.on("load", () => {
        if (disposed) return;
        mapRef.current = map;
        renderRoutesOnMap(map, routes, selectedRouteId, liveIncidents);
      });

      map.on("style.load", () => {
        if (disposed || !mapRef.current) return;
        renderRoutesOnMap(map, routes, selectedRouteId, liveIncidents);
      });
    }

    void initMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map polylines whenever routes or incidents change
  useEffect(() => {
    if (mapRef.current) {
      renderRoutesOnMap(mapRef.current, routes, selectedRouteId, liveIncidents);
    }
  }, [routes, selectedRouteId, liveIncidents]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeRoute = routes.find((r) => r.id === (selectedRouteId ?? routes[0]?.id));

  return (
    <div className="space-y-4">
      {/* Search / Selection Card */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-surface-on">City Route Intelligence</h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container text-surface-on-variant">
            ESTIMATED · FREE-FLOW ONLY
          </span>
        </div>

        <p className="text-xs text-surface-on-variant">
          Select any origin and destination across Mangaluru to calculate real driving paths, compare alternatives, and automatically detour around verified incidents.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Origin selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-surface-on flex items-center gap-1.5" htmlFor="start-select">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                Origin (Start A)
              </label>
              <button
                type="button"
                onClick={handleRequestGps}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                📍 My location
              </button>
            </div>
            {useGpsStart && userLocation ? (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100">
                <span>GPS fix ({userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)})</span>
                <button
                  type="button"
                  onClick={() => setUseGpsStart(false)}
                  className="text-[11px] font-semibold underline ml-2"
                >
                  Reset
                </button>
              </div>
            ) : (
              <select
                id="start-select"
                className="w-full text-xs rounded-lg border border-surface-container bg-surface-container-low px-3 py-2 text-surface-on"
                value={startIndex}
                onChange={(e) => {
                  setUseGpsStart(false);
                  setStartIndex(Number(e.target.value));
                }}
              >
                {MANGALURU_PRESETS.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {gpsError && <p className="text-[11px] text-rose-600">{gpsError}</p>}
          </div>

          {/* Destination selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-on flex items-center gap-1.5" htmlFor="dest-select">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
              Destination (End B)
            </label>
            <select
              id="dest-select"
              className="w-full text-xs rounded-lg border border-surface-container bg-surface-container-low px-3 py-2 text-surface-on"
              value={destIndex}
              onChange={(e) => setDestIndex(Number(e.target.value))}
            >
              {MANGALURU_PRESETS.map((p, idx) => (
                <option key={p.name} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="button text-xs px-5 py-2 font-semibold"
              disabled={isPending}
              onClick={() => fetchRoutes(activeStart, activeDest)}
            >
              {isPending ? "Calculating paths…" : "Find Best Route"}
            </button>
            <button
              type="button"
              className="text-xs px-3 py-2 rounded-lg border border-surface-container bg-surface-container-low text-surface-on hover:bg-surface-container transition flex items-center gap-1.5 font-medium"
              onClick={() => setShowReportForm((prev) => !prev)}
            >
              <span>📢</span>
              <span>{showReportForm ? "Close Form" : "Report Incident"}</span>
            </button>
          </div>
          <span className="text-[11px] text-surface-on-variant">
            {liveIncidents.length} active live incident{liveIncidents.length !== 1 ? "s" : ""} on map
          </span>
        </div>
      </div>

      {reportFeedback && (
        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-surface-on">
          {reportFeedback}
        </div>
      )}

      {/* Expandable Incident Reporting Form (Plan 4 Module 3) */}
      {showReportForm && (
        <form
          onSubmit={handleReportSubmit}
          className="p-4 rounded-xl bg-surface-container-lowest border border-primary/30 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-on flex items-center gap-2">
              <span>📢</span> Report Road Incident at Your Location
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-surface-on-variant">
              L1–L3 SERVER VERIFICATION
            </span>
          </div>

          <p className="text-xs text-surface-on-variant">
            Reports with device GPS fix under 2 minutes old advance to L2 immediately. When 3 distinct commuters report within 300m and 15 minutes, the server promotes the incident to L3 and triggers automatic re-routing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-on" htmlFor="report-cat">
                Incident Type (17 PDF categories)
              </label>
              <select
                id="report-cat"
                className="w-full text-xs rounded-lg border border-surface-container bg-surface-container-low px-3 py-2 text-surface-on"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as ReportCategory)}
              >
                {Object.entries(reportCategories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {reportCategoryIcons[key as ReportCategory]} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Location */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-surface-on" htmlFor="report-loc">
                  Incident Location
                </label>
                <button
                  type="button"
                  onClick={handleRequestGps}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  📍 Use device GPS (L2)
                </button>
              </div>
              {useGpsReport && userLocation ? (
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100">
                  <span>GPS fix ({userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)})</span>
                  <button
                    type="button"
                    onClick={() => setUseGpsReport(false)}
                    className="text-[11px] font-semibold underline ml-2"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <select
                  id="report-loc"
                  className="w-full text-xs rounded-lg border border-surface-container bg-surface-container-low px-3 py-2 text-surface-on"
                  value={reportLocationIndex}
                  onChange={(e) => {
                    setUseGpsReport(false);
                    setReportLocationIndex(Number(e.target.value));
                  }}
                >
                  {MANGALURU_PRESETS.map((p, idx) => (
                    <option key={p.name} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Note input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-on" htmlFor="report-note">
              Optional Note
            </label>
            <input
              id="report-note"
              type="text"
              placeholder="e.g. Near traffic signal, left lane blocked"
              className="w-full text-xs rounded-lg border border-surface-container bg-surface-container-low px-3 py-2 text-surface-on"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-lg border border-surface-container text-surface-on-variant hover:bg-surface-container"
              onClick={() => setShowReportForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button text-xs px-5 py-1.5 font-semibold"
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? "Submitting…" : "Submit Incident Report"}
            </button>
          </div>
        </form>
      )}

      {statusMessage && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-100">
          {statusMessage}
        </div>
      )}

      {/* Incident Avoidance Banner (when re-routing triggered) */}
      {activeRoute?.avoids_incident && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-400 dark:border-amber-800 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-100">
              Automatic Incident Avoidance Detour
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {activeRoute.avoided_incident_reason}. System selected an alternative route avoiding the congestion zone.
            </p>
          </div>
        </div>
      )}

      {/* Map display */}
      <div className="relative rounded-xl overflow-hidden border border-surface-container shadow-sm bg-surface-container-low">
        <div ref={mapContainer} className="w-full h-80 sm:h-96" />
        <div className="absolute top-2 left-2 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-surface-container text-[11px] space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-blue-600 rounded" />
            <span className="font-semibold text-surface-on">Recommended route</span>
          </div>
          {routes.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-slate-500 rounded border-dashed" />
              <span className="text-surface-on-variant">Alternative path</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Cards */}
      {routes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {routes.map((r, index) => {
            const isSelected = r.id === (selectedRouteId ?? routes[0]?.id);
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-surface-container-lowest border-surface-container hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-surface-on flex items-center gap-1.5">
                    {r.is_recommended && <span className="text-primary font-bold">★ Recommended</span>}
                    {!r.is_recommended && <span className="text-surface-on-variant">Option {index + 1}</span>}
                  </span>
                  {r.avoids_incident && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100">
                      Detour
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-surface-on">
                    {formatRouteDuration(r.duration_s)}
                  </span>
                  <span className="text-sm font-medium text-surface-on-variant">
                    {formatRouteDistance(r.distance_m)}
                  </span>
                </div>

                <p className="text-xs text-surface-on-variant leading-tight">
                  {r.name}
                </p>

                {r.incidents_on_route.length > 0 && (
                  <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-300">
                    ⚠️ Passes near {r.incidents_on_route.length} reported incident ({r.incidents_on_route[0].label})
                  </div>
                )}

                {isSelected && (
                  <div className="pt-2 border-t border-surface-container flex items-center justify-between">
                    <span className="text-[11px] text-surface-on-variant">Ready to commute?</span>
                    <Link
                      href="/workspace"
                      className="text-xs font-semibold px-3 py-1 rounded bg-primary text-primary-on hover:opacity-90 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Track this journey →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
