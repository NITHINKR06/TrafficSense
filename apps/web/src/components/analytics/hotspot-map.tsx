"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as MapInstance, Marker as MarkerInstance, Popup as PopupInstance } from "maplibre-gl";
import { createFallbackStyle } from "@/lib/traffic/mangaluru-basemap";
import { attachMapResizeObserver } from "@/lib/map/attach-resize-observer";
import type { HistoricalIncident } from "@/lib/analytics/history";
import type { HotspotRanking } from "@/lib/analytics/metrics";
import "maplibre-gl/dist/maplibre-gl.css";
import { getIncidentSvgString } from "@/components/icons/incident-icons";
import { RefreshIcon, XIcon } from "@/components/icons/ui-icons";

function getCauseIcon(cause: string): string {
  switch (cause) {
    case "accident": return getIncidentSvgString("accident", 14);
    case "road_repair": return getIncidentSvgString("road_repair", 14);
    case "heavy_volume": return getIncidentSvgString("heavy_traffic", 14);
    case "flood": return getIncidentSvgString("flood", 14);
    default: return getIncidentSvgString("other", 14);
  }
}

function getCauseLabel(cause: string): string {
  switch (cause) {
    case "accident": return "Accident";
    case "road_repair": return "Road Maintenance";
    case "heavy_volume": return "Heavy Volume";
    case "flood": return "Waterlogging";
    default: return "General Incident";
  }
}

/** Canonical coordinates [lng, lat] for Mangaluru corridor junctions tracked by analytics. */
export const HOTSPOT_GEO_COORDS: Record<string, [number, number]> = {
  hampankatta: [74.842, 12.868],
  "ksrtc-bejai": [74.848, 12.885],
  "jyothi-ambedkar": [74.845, 12.871],
  ladyhill: [74.841, 12.894],
  pumpwell: [74.862, 12.858],
};

const MANGALURU_CORRIDOR_CENTER: [number, number] = [74.851, 12.876];
const DEFAULT_ZOOM = 13.0;

type HotspotMapProps = {
  hotspots: HotspotRanking[];
  liveIncidents?: HistoricalIncident[];
  selectedHotspotId?: string | null;
  onSelectHotspot?: (id: string | null) => void;
  showDemoHistory?: boolean;
  className?: string;
  heightClassName?: string;
};

export function HotspotMap({
  hotspots,
  liveIncidents = [],
  selectedHotspotId = null,
  onSelectHotspot,
  showDemoHistory = false,
  className = "",
  heightClassName = "h-[580px] sm:h-[660px] lg:h-[740px]",
}: HotspotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const hotspotMarkersRef = useRef<Record<string, MarkerInstance>>({});
  const liveMarkersRef = useRef<MarkerInstance[]>([]);
  const activePopupRef = useRef<PopupInstance | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showLivePins, setShowLivePins] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHudDrawer, setShowHudDrawer] = useState(true);

  // Initialize MapLibre GL map
  useEffect(() => {
    let disposed = false;
    let map: MapInstance | null = null;
    let fallbackUsed = false;

    let detachResize: (() => void) | null = null;
    async function initMap() {
      try {
        const { Map, NavigationControl, setWorkerUrl } = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;

        setWorkerUrl("/maplibre-gl-worker.mjs");

        map = new Map({
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: MANGALURU_CORRIDOR_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: 11,
          maxZoom: 17,
          maxBounds: [
            [74.70, 12.75],
            [74.95, 13.05],
          ],
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          cooperativeGestures: true,
        });
        detachResize = attachMapResizeObserver(containerRef.current, map);

        map.addControl(new NavigationControl({ showCompass: false }), "top-right");

        map.on("error", () => {
          if (!fallbackUsed && map) {
            fallbackUsed = true;
            try {
              map.setStyle(createFallbackStyle());
            } catch {
              // ignore fallback error
            }
          }
        });

        map.once("load", () => {
          if (disposed) return;
          mapRef.current = map;
          setMapReady(true);
        });
      } catch (err) {
        console.error("Failed to initialize OpenStreetMap hotspot map:", err);
      }
    }

    void initMap();

    return () => {
      disposed = true;
      detachResize?.();
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
      Object.values(hotspotMarkersRef.current).forEach((m) => m.remove());
      hotspotMarkersRef.current = {};
      liveMarkersRef.current.forEach((m) => m.remove());
      liveMarkersRef.current = [];
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle Fullscreen toggle and canvas resize
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        mapRef.current?.resize();
      }, 150);
      return next;
    });
  }, []);

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => {
          mapRef.current?.resize();
        }, 150);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Window resize observer to ensure canvas always stays sharp
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset view to whole Mangaluru corridor
  const handleResetView = useCallback(() => {
    if (!mapRef.current) return;
    onSelectHotspot?.(null);
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
    mapRef.current.flyTo({
      center: MANGALURU_CORRIDOR_CENTER,
      zoom: DEFAULT_ZOOM,
      duration: 800,
    });
  }, [onSelectHotspot]);

  // Render or update ranked corridor hotspot markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let disposed = false;

    // Clean existing hotspot markers
    Object.values(hotspotMarkersRef.current).forEach((m) => m.remove());
    hotspotMarkersRef.current = {};

    void import("maplibre-gl").then(({ Marker, Popup }) => {
      if (disposed || !mapRef.current) return;

      hotspots.forEach((h, index) => {
        const coords = HOTSPOT_GEO_COORDS[h.junction_id];
        if (!coords) return;

        const rankNumber = index + 1;
        const isTopHotspot = rankNumber === 1;
        const isSelected = selectedHotspotId === h.junction_id;

        // Create custom DOM element for ranked marker
        const el = document.createElement("div");
        el.className = "group relative flex flex-col items-center cursor-pointer select-none transition-transform duration-200";
        el.style.zIndex = isSelected ? "40" : isTopHotspot ? "30" : `${25 - index}`;
        if (isSelected) {
          el.style.transform = "scale(1.2)";
        }

        // Outer badge
        const badge = document.createElement("div");
        badge.className = `flex items-center justify-center font-bold font-mono text-white rounded-full shadow-lg border-2 ${
          isTopHotspot
            ? "bg-red-600 border-white ring-4 ring-red-400/50 w-10 h-10 text-xs"
            : rankNumber <= 3
            ? "bg-amber-600 border-white ring-2 ring-amber-400/40 w-9 h-9 text-xs"
            : "bg-indigo-600 border-white w-8 h-8 text-[11px]"
        } ${isSelected ? "ring-4 ring-primary scale-110" : ""}`;
        badge.innerHTML = `<span>#${rankNumber}</span>`;

        // Pulse ring for #1 worst hotspot
        if (isTopHotspot) {
          const pulse = document.createElement("div");
          pulse.className = "absolute -inset-1.5 rounded-full bg-red-500/30 animate-ping pointer-events-none";
          el.appendChild(pulse);
        }

        el.appendChild(badge);

        // Junction name chip underneath
        const label = document.createElement("div");
        label.className = `mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-tight whitespace-nowrap shadow-sm border ${
          isSelected
            ? "bg-primary text-white border-primary"
            : "bg-surface-container-lowest/95 text-surface-on border-surface-container hover:bg-surface-container-low"
        }`;
        label.textContent = h.junction_name.split(" ")[0];
        el.appendChild(label);

        // Popup HTML content
        const delayHtml = showDemoHistory
          ? `<strong class="text-amber-600 dark:text-amber-400">${h.total_delay_hours} hrs</strong> commuter delay`
          : `<span class="text-surface-on-variant">Not measured (live reports only)</span>`;

        const avgDelayHtml = showDemoHistory
          ? `Avg <span class="font-semibold text-surface-on">~${h.average_delay_minutes} min</span> delay`
          : `<span class="text-surface-on-variant">Live frequency view</span>`;

        const popupContent = `
          <div class="p-3 text-xs space-y-2 font-sans min-w-[220px]">
            <div class="flex items-center justify-between gap-2 border-b border-surface-container pb-1.5">
              <span class="font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                isTopHotspot ? "bg-red-600 text-white" : "bg-primary text-white"
              }">RANK #${rankNumber} HOTSPOT</span>
              <span class="font-mono text-[10px] text-surface-on-variant">${h.primary_window}</span>
            </div>
            <p class="font-bold text-sm text-surface-on leading-tight">${h.junction_name}</p>
            <div class="text-[11px] text-surface-on-variant space-y-1.5">
              <div class="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary shrink-0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>${delayHtml}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><strong>${h.incident_count}</strong> recorded events (${avgDelayHtml})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-surface-on-variant shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Predominant cause: <strong class="capitalize">${h.primary_cause.replace("_", " ")}</strong></span>
              </div>
            </div>
          </div>
        `;

        const popup = new Popup({
          offset: 28,
          closeButton: true,
          maxWidth: "300px",
          className: "hotspot-popup",
        }).setHTML(popupContent);

        el.addEventListener("click", () => {
          onSelectHotspot?.(h.junction_id);
          if (activePopupRef.current) {
            activePopupRef.current.remove();
          }
          popup.setLngLat(coords).addTo(map);
          activePopupRef.current = popup;
          map.flyTo({ center: coords, zoom: 15.0, duration: 600 });
        });

        const marker = new Marker({ element: el, anchor: "center" })
          .setLngLat(coords)
          .addTo(map);

        hotspotMarkersRef.current[h.junction_id] = marker;

        // If this marker is selected, show popup
        if (isSelected) {
          popup.setLngLat(coords).addTo(map);
          activePopupRef.current = popup;
        }
      });
    });

    return () => {
      disposed = true;
    };
  }, [hotspots, mapReady, selectedHotspotId, showDemoHistory, onSelectHotspot]);

  // Fly to selected hotspot if selection changed from external table click
  useEffect(() => {
    if (!mapRef.current || !selectedHotspotId) return;
    const coords = HOTSPOT_GEO_COORDS[selectedHotspotId];
    if (coords) {
      mapRef.current.flyTo({ center: coords, zoom: 15.0, duration: 600 });
    }
  }, [selectedHotspotId]);

  // Render live incident pins on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let disposed = false;
    liveMarkersRef.current.forEach((m) => m.remove());
    liveMarkersRef.current = [];

    if (!showLivePins || liveIncidents.length === 0) return;

    void import("maplibre-gl").then(({ Marker, Popup }) => {
      if (disposed || !mapRef.current) return;

      liveIncidents.forEach((inc) => {
        const hasExactCoords = typeof inc.lng === "number" && Number.isFinite(inc.lng) && typeof inc.lat === "number" && Number.isFinite(inc.lat);
        const jCoords = HOTSPOT_GEO_COORDS[inc.junction_id];
        const lng = hasExactCoords ? inc.lng! : (jCoords ? jCoords[0] : 74.848);
        const lat = hasExactCoords ? inc.lat! : (jCoords ? jCoords[1] : 12.875);

        const el = document.createElement("div");
        el.className =
          "px-2 py-0.5 rounded-full bg-surface-container-lowest/95 border border-amber-500 shadow-md flex items-center gap-1 text-[11px] font-bold cursor-pointer hover:scale-110 transition";
        const icon = getCauseIcon(inc.cause);
        const causeLabel = getCauseLabel(inc.cause);
        const badgeText = inc.level ?? "LIVE";
        el.title = `Live report: ${inc.junction_name} (${causeLabel} · ${badgeText})`;
        el.innerHTML = `<span>${icon}</span><span class="text-[9px] px-1 rounded bg-amber-500 text-white font-mono font-bold">${badgeText}</span>`;

        const popup = new Popup({ offset: 20, closeButton: true, maxWidth: "260px" }).setHTML(`
          <div class="p-2.5 text-xs space-y-1">
            <p class="font-bold text-surface-on">${icon} ${causeLabel} (${badgeText})</p>
            <p class="text-surface-on-variant text-[11px]">Near ${inc.junction_name} (${lat.toFixed(4)}, ${lng.toFixed(4)})</p>
            <p class="text-[10px] font-mono text-amber-600">Reported at ${inc.occurred_at.slice(0, 16).replace("T", " ")} UTC</p>
          </div>
        `);

        el.addEventListener("click", () => {
          popup.setLngLat([lng, lat]).addTo(map);
        });

        const marker = new Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);

        liveMarkersRef.current.push(marker);
      });
    });

    return () => {
      disposed = true;
    };
  }, [liveIncidents, mapReady, showLivePins]);

  const glass = "bg-white/[.86] backdrop-blur-[18px] backdrop-saturate-[1.7] shadow-[0_8px_22px_rgba(17,20,26,0.12)]";
  const flyTo = (id: string) => {
    onSelectHotspot?.(id);
    const coords = HOTSPOT_GEO_COORDS[id];
    if (coords && mapRef.current) mapRef.current.flyTo({ center: coords, zoom: 15.0, duration: 600 });
  };

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-[#ECE6D8] m-0 p-0"
          : `rounded-[36px] bg-[#ECE6D8] shadow-[0_10px_30px_rgba(17,20,26,0.12)] ${className}`
      }`}
    >
      {/* Top controls */}
      <div className="absolute top-[18px] left-[18px] right-[18px] z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className={`${glass} pointer-events-auto h-10 pl-4 pr-2 rounded-full flex items-center gap-2.5`}>
          <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-[#11141A]">Corridor hotspot map</span>
          <span className="h-6 px-2.5 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
            OPENSTREETMAP
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetView}
          className={`${glass} pointer-events-auto h-10 px-4 rounded-full text-[13px] font-semibold text-[#11141A] inline-flex items-center gap-1.5 cursor-pointer`}
          title="Reset map view to whole Mangaluru corridor"
          aria-label="Reset view"
        >
          <RefreshIcon size={15} className="shrink-0" />
          <span>Reset view</span>
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className={`pointer-events-auto h-10 px-4 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            isFullscreen ? "bg-[#11141A] text-[#F3EFE6] shadow-[0_8px_22px_rgba(17,20,26,0.2)]" : `${glass} text-[#11141A]`
          }`}
          title={isFullscreen ? "Exit full screen (Esc)" : "Expand to full screen"}
          aria-label={isFullscreen ? "Exit full screen" : "Expand to full screen"}
        >
          {isFullscreen ? (
            <XIcon size={15} className="shrink-0" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
          <span>{isFullscreen ? "Exit full screen" : "Full screen"}</span>
        </button>
      </div>

      {/* Jump-to chips */}
      <div className={`${glass} absolute top-[68px] left-[18px] z-20 hidden sm:flex flex-wrap items-center gap-1 p-1 rounded-full max-w-[calc(100%-36px)]`}>
        <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#4A505C] pl-3 pr-1.5">JUMP TO</span>
        {hotspots.map((h, idx) => (
          <button
            key={h.junction_id}
            type="button"
            onClick={() => flyTo(h.junction_id)}
            className={`h-8 pl-2.5 pr-3.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              selectedHotspotId === h.junction_id ? "bg-[#11141A] text-[#F3EFE6]" : "text-[#11141A] hover:bg-[#F3EFE6]"
            }`}
          >
            <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-mono text-[10px] font-bold ${idx === 0 ? "bg-[#FF5B2E] text-[#11141A]" : selectedHotspotId === h.junction_id ? "bg-[#2A303C] text-[#F3EFE6]" : "bg-[#11141A] text-[#F3EFE6]"}`}>
              {idx + 1}
            </span>
            <span>{h.junction_name.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className={`${glass} absolute bottom-[18px] left-[18px] z-20 h-10 pl-3 pr-4 rounded-full flex flex-wrap items-center gap-4 text-[12px] font-semibold text-[#11141A]`}>
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#FF5B2E] text-[#11141A] font-mono text-[10px] font-bold inline-flex items-center justify-center">1</span>
          Top hotspot
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#11141A] text-[#F3EFE6] font-mono text-[10px] font-bold inline-flex items-center justify-center">2</span>
          Ranked
        </span>
        {liveIncidents.length > 0 && (
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showLivePins} onChange={(e) => setShowLivePins(e.target.checked)} className="w-4 h-4 accent-[#11141A]" />
            Live reports ({liveIncidents.length})
          </label>
        )}
      </div>

      {/* Full-screen rankings drawer */}
      {isFullscreen && (
        <div className="absolute top-[18px] right-[18px] z-20 w-80 max-w-[calc(100%-36px)] rounded-[28px] bg-white shadow-[0_14px_34px_rgba(17,20,26,0.20)] overflow-hidden flex flex-col max-h-[85vh]">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="font-display text-lg font-bold tracking-[-0.02em] text-[#11141A]">Hotspot ranking</span>
            <button type="button" onClick={() => setShowHudDrawer(!showHudDrawer)} className="text-xs font-semibold text-[#FF5B2E] hover:underline cursor-pointer">
              {showHudDrawer ? "Minimize" : "Show"}
            </button>
          </div>
          {showHudDrawer && (
            <ol className="list-none m-0 px-3 pb-3 flex flex-col gap-1.5 overflow-y-auto">
              {hotspots.map((h, idx) => (
                <li key={h.junction_id}>
                  <button
                    type="button"
                    onClick={() => flyTo(h.junction_id)}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer ${
                      selectedHotspotId === h.junction_id ? "bg-[#F3EFE6]" : "hover:bg-[#F8F5EE]"
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-full shrink-0 inline-flex items-center justify-center font-mono text-xs font-bold ${idx === 0 ? "bg-[#FF5B2E] text-[#11141A]" : "bg-[#11141A] text-[#F3EFE6]"}`}>
                        {idx + 1}
                      </span>
                      <span className="text-[15px] font-semibold text-[#11141A] truncate">{h.junction_name}</span>
                    </span>
                    <span className="font-display text-lg font-bold text-[#11141A]">
                      {showDemoHistory ? `${h.total_delay_hours}h` : h.incident_count}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Map canvas */}
      <div
        ref={containerRef}
        className={`w-full bg-[#ECE6D8] ${isFullscreen ? "h-screen w-screen" : heightClassName}`}
        aria-label="Interactive OpenStreetMap of Mangaluru corridor congestion hotspots"
      />
    </div>
  );
}