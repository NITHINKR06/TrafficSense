"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { Map as MapInstance, Marker as MarkerInstance } from "maplibre-gl";
import { formatRouteDuration, formatRouteDistance, type RouteOption } from "@/lib/routing/types";
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
  const [useGpsStart, setUseGpsStart] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  // Map rendering helper
  const renderRoutesOnMap = (map: MapInstance, routeList: RouteOption[], selectedId: string | null) => {
    // Clear old markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    // Remove existing layers and sources if present
    if (map.getLayer("routes-alt-layer")) map.removeLayer("routes-alt-layer");
    if (map.getLayer("routes-primary-layer")) map.removeLayer("routes-primary-layer");
    if (map.getSource("routes-geojson")) map.removeSource("routes-geojson");

    if (routeList.length === 0) return;

    // Build GeoJSON features for all routes
    const features = routeList.map((r) => ({
      type: "Feature" as const,
      properties: {
        id: r.id,
        is_selected: r.id === (selectedId ?? routeList[0].id),
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
      filter: ["!=", ["get", "id"], selectedId ?? routeList[0].id],
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
      filter: ["==", ["get", "id"], selectedId ?? routeList[0].id],
      paint: {
        "line-color": "#2563eb",
        "line-width": 6,
        "line-opacity": 0.95,
      },
    });

    // Add Start and Destination markers
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

      // Fit map bounds to encompass the route coordinates
      const selected = routeList.find((r) => r.id === (selectedId ?? routeList[0].id));
      if (selected && selected.geometry.coordinates.length > 0) {
        const bounds = new LngLatBounds();
        for (const coord of selected.geometry.coordinates) {
          bounds.extend(coord as [number, number]);
        }
        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      }
    });
  };

  // Initialize route on mount
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      try {
        const res = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: activeStart, destination: activeDest }),
        });
        const data = await res.json();
        if (!cancelled && data.ok && Array.isArray(data.routes) && data.routes.length > 0) {
          setRoutes(data.routes);
          setSelectedRouteId(data.routes[0].id);
        }
      } catch {
        // Ignore failure on initial mount
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
      const { Map, NavigationControl, AttributionControl } = await import("maplibre-gl");
      if (disposed || !mapContainer.current) return;

      const map = new Map({
        container: mapContainer.current,
        style: createFallbackStyle(),
        center: [74.85, 12.875],
        zoom: 12.5,
        attributionControl: false,
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        if (disposed) return;
        mapRef.current = map;
        renderRoutesOnMap(map, routes, selectedRouteId);
      });
    }

    void initMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map polylines whenever routes change
  useEffect(() => {
    if (mapRef.current) {
      renderRoutesOnMap(mapRef.current, routes, selectedRouteId);
    }
  }, [routes, selectedRouteId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          Select any origin and destination across Mangaluru to calculate real driving paths, estimated travel times, and incident detours.
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
                <span>Current GPS position ({userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)})</span>
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

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="button text-xs px-5 py-2 font-semibold"
            disabled={isPending}
            onClick={() => fetchRoutes(activeStart, activeDest)}
          >
            {isPending ? "Calculating paths…" : "Find Best Route"}
          </button>
          <span className="text-[11px] text-surface-on-variant">
            Routes calculated via OSM highway network
          </span>
        </div>
      </div>

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
            const isSelected = r.id === (selectedRouteId ?? routes[0].id);
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
