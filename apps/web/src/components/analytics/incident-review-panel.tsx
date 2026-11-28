"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};
import Link from "next/link";
import { reportCategories, reportCategoryIcons } from "@/lib/reports/rules";
import type { AuthorityIncidentHistoryItem, AuthorityNotificationItem, LiveIncident } from "@/lib/incidents/server";
import type { SpreadResult } from "@/lib/routing/spread";
import { IncidentIcon } from "@/components/icons/incident-icons";
import { AlertTriangleIcon, CameraIcon, XIcon } from "@/components/icons/ui-icons";

function formatIncidentTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: 880 Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2: 1174.66 Hz (D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // AudioContext blocked or not supported
  }
}


/** Category disc colours from the Authority design plan. */
function categoryTone(category: string): { bg: string; fg: string } {
  switch (category) {
    case "accident":
      return { bg: "#FF5B2E", fg: "#11141A" };
    case "heavy_traffic":
    case "heavy_volume":
      return { bg: "#F5B700", fg: "#11141A" };
    case "road_repair":
    case "road_closed":
    case "bridge_maintenance":
      return { bg: "#11141A", fg: "#F3EFE6" };
    case "flood":
    case "heavy_rain":
      return { bg: "#2B4BFF", fg: "#FFFFFF" };
    default:
      return { bg: "#F3EFE6", fg: "#11141A" };
  }
}

/** Six equal trust segments (L1..L6): filled = ink, empty = #E8E2D3. */
function TrustBar({ level }: { level: string }) {
  const n = Math.min(6, Math.max(1, parseInt(level.replace(/\D/g, ""), 10) || 1));
  return (
    <div className="grid grid-cols-6 gap-1" role="img" aria-label={`Trust level ${n} of 6`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <span key={i} className="h-2 rounded-full" style={{ background: i <= n ? "#11141A" : "#E8E2D3" }} />
      ))}
    </div>
  );
}

const monoLabel = "font-mono text-[11px] font-semibold uppercase tracking-[0.08em]";

export function IncidentReviewPanel() {
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [history, setHistory] = useState<AuthorityIncidentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIncidentId, setPendingIncidentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Real-time Authority Push Notifications
  const [notifications, setNotifications] = useState<AuthorityNotificationItem[]>([]);
  const [latestAlert, setLatestAlert] = useState<AuthorityNotificationItem | null>(null);
  const browserNotificationGranted = useSyncExternalStore(
    subscribeNoop,
    () => typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted",
    () => false
  );
  const [permOverride, setPermOverride] = useState(false);
  const hasWebNotificationPerm = browserNotificationGranted || permOverride;
  const [highlightedIncidentId, setHighlightedIncidentId] = useState<string | null>(null);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const isFirstPoll = useRef(true);

  // Spread check state
  const [spreadIncidentId, setSpreadIncidentId] = useState<string | null>(null);
  const [spreadResult, setSpreadResult] = useState<SpreadResult | null>(null);
  const [spreadLoading, setSpreadLoading] = useState(false);
  const [spreadError, setSpreadError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async (): Promise<LiveIncident[]> => {
    const response = await fetch("/api/incidents?include_photos=1", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok || !Array.isArray(data.incidents)) {
      throw new Error("Unable to load active incidents.");
    }
    return data.incidents;
  }, []);

  const fetchHistory = useCallback(async (): Promise<AuthorityIncidentHistoryItem[]> => {
    const response = await fetch("/api/incidents?scope=authority-history", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok || !Array.isArray(data.history)) throw new Error("Unable to load incident history.");
    return data.history;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setPermOverride(perm === "granted");
      if (perm === "granted") {
        new Notification("TrafficSense Control Room Alerts", {
          body: "Push notifications active for commuter incident sightings with photo evidence.",
          icon: "/favicon.ico",
        });
      }
    }
  }, []);

  // Heartbeat Poller for Authority Push Notifications
  useEffect(() => {
    let mounted = true;

    async function pollNotifications() {
      try {
        const res = await fetch("/api/authority/notifications?limit=25", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted || !data.ok || !Array.isArray(data.notifications)) return;

        const incoming: AuthorityNotificationItem[] = data.notifications;
        setNotifications(incoming);

        // Find truly new notifications not seen in this session
        const newItems = incoming.filter((n) => !seenNotificationIds.current.has(n.id));
        for (const item of incoming) {
          seenNotificationIds.current.add(item.id);
        }

        if (!isFirstPoll.current && newItems.length > 0) {
          const newest = newItems[0];
          setLatestAlert(newest);
          setHighlightedIncidentId(newest.incident_id);
          playNotificationChime();

          // Native OS Notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const photoBadge = newest.has_photo ? " [Photo Verified]" : "";
            const cat = reportCategories[newest.category as keyof typeof reportCategories] ?? newest.category;
            new Notification(`Road Hazard Spotted: ${cat}`, {
              body: `${newest.landmark}${photoBadge} • Level ${newest.level}`,
              icon: "/favicon.ico",
            });
          }

          // Automatically reload incident list so it appears in the review queue in real-time
          void fetchIncidents().then((reloaded) => {
            if (mounted) setIncidents(reloaded);
          });
        }
        isFirstPoll.current = false;
      } catch {
        // Heartbeat poll retry silently
      }
    }

    void pollNotifications();
    const interval = setInterval(() => void pollNotifications(), 3500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchIncidents]);

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      try {
        const [loaded, loadedHistory] = await Promise.all([fetchIncidents(), fetchHistory()]);
        if (active) {
          setIncidents(loaded);
          setHistory(loadedHistory);
        }
      } catch {
        if (active) setMessage("Active incidents could not be loaded. Refresh to retry.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadAll();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadAll();
    };
    window.addEventListener("focus", loadAll);
    document.addEventListener("visibilitychange", onVisibility);
    const poll = setInterval(() => void loadAll(), 5000);

    return () => {
      active = false;
      window.removeEventListener("focus", loadAll);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(poll);
    };
  }, [fetchHistory, fetchIncidents]);

  async function loadIncidents() {
    setIsLoading(true);
    setMessage(null);
    try {
      const [loaded, loadedHistory] = await Promise.all([fetchIncidents(), fetchHistory()]);
      setIncidents(loaded);
      setHistory(loadedHistory);
    } catch {
      setMessage("Active incidents could not be loaded. Refresh to retry.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateIncident(incident: LiveIncident, action: "confirm" | "resolve" | "reject") {
    const actionLabel = action === "confirm" ? "confirm" : action === "resolve" ? "resolve" : "reject";
    if (!window.confirm(`Are you sure you want to ${actionLabel} this ${reportCategories[incident.category]} incident?`)) return;

    setPendingIncidentId(incident.id);
    setMessage(null);
    try {
      const response = await fetch("/api/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_id: incident.id, action }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Update failed.");
      setMessage(action === "confirm" ? "Incident marked as authority-confirmed (L6)." : action === "resolve" ? "Incident resolved and removed from active review." : "Incident rejected and removed from public active views.");
      await loadIncidents();
      window.dispatchEvent(new Event("trafficsense:incidents-changed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this incident.");
    } finally {
      setPendingIncidentId(null);
    }
  }

  async function handleCheckSpread(incident: LiveIncident) {
    if (spreadIncidentId === incident.id && spreadResult) {
      // Toggle off if already showing
      setSpreadIncidentId(null);
      setSpreadResult(null);
      setSpreadError(null);
      return;
    }

    setSpreadIncidentId(incident.id);
    setSpreadLoading(true);
    setSpreadError(null);
    setSpreadResult(null);

    try {
      const originName = "Pumpwell (Mahaveera) Circle";
      const res = await fetch(`/api/spread?incident=${encodeURIComponent(incident.id)}&origin=${encodeURIComponent(originName)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Could not check route spread.");
      }
      setSpreadResult(data);
    } catch (err) {
      setSpreadError(err instanceof Error ? err.message : "Failed to check spread.");
    } finally {
      setSpreadLoading(false);
    }
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <section className="space-y-3.5" aria-labelledby="incident-review-title">
      {/* Real-time alert */}
      {latestAlert && (
        <div role="alert" className="rounded-[32px] bg-[#FFE3D8] border border-[#FF5B2E]/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="w-[50px] h-[50px] rounded-full bg-[#FF5B2E] text-[#11141A] flex items-center justify-center shrink-0">
              <AlertTriangleIcon size={26} className="shrink-0" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${monoLabel} !text-[10px] text-[#8F3209]`}>New incident spotted</span>
                {latestAlert.has_photo && (
                  <span className="h-6 px-2.5 rounded-full bg-[#EFF9C4] text-[#11141A] inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold">
                    <CameraIcon size={12} className="shrink-0" /> PHOTO EVIDENCE
                  </span>
                )}
                <span className="h-6 px-2.5 rounded-full bg-white text-[#11141A] inline-flex items-center font-mono text-[10px] font-semibold">{latestAlert.level}</span>
              </div>
              <p className="font-display text-xl font-bold tracking-[-0.02em] text-[#11141A] m-0 mt-1">
                {reportCategories[latestAlert.category as keyof typeof reportCategories] ?? latestAlert.category}
                <span className="font-sans text-sm font-medium text-[#4A505C]"> · {latestAlert.landmark}</span>
              </p>
              {latestAlert.photo_summary && (
                <p className="text-xs text-[#4A505C] italic m-0 mt-1">&ldquo;{latestAlert.photo_summary}&rdquo;</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              className="h-12 px-5 rounded-full bg-[#11141A] text-[#F3EFE6] text-sm font-semibold whitespace-nowrap hover:bg-[#2A303C] cursor-pointer"
              onClick={() => {
                setHighlightedIncidentId(latestAlert.incident_id);
                document.getElementById(`incident-${latestAlert.incident_id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Inspect &amp; review →
            </button>
            <button type="button" className="w-12 h-12 rounded-full bg-white text-[#11141A] flex items-center justify-center cursor-pointer" onClick={() => setLatestAlert(null)} aria-label="Dismiss alert">
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 id="incident-review-title" className="font-display text-2xl font-bold tracking-[-0.02em] text-[#11141A] m-0">Review queue</h2>
            <span className={`${monoLabel} text-[#4A505C]`}>{incidents.length} active</span>
            {unread > 0 && (
              <span className="h-6 px-2.5 rounded-full bg-[#FF5B2E] text-[#11141A] inline-flex items-center font-mono text-[10px] font-bold">{unread} NEW</span>
            )}
          </div>
          <p className="text-xs text-[#4A505C] mt-1.5 mb-0 max-w-2xl leading-relaxed">
            Confirming records an L6 authority decision; resolving removes the incident from public active views. Reported cause and congestion evidence remain separate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasWebNotificationPerm ? (
            <span className="h-12 px-5 rounded-full bg-[#EFF9C4] text-[#11141A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
              <span className="w-2 h-2 rounded-full bg-[#11141A]" /> ALERTS ACTIVE
            </span>
          ) : (
            <button
              type="button"
              className="h-12 px-5 rounded-full bg-white text-[#11141A] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              onClick={() => void requestNotificationPermission()}
              title="Allow browser notifications for real-time alerts"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              Enable push alerts
            </button>
          )}
          <button
            type="button"
            className="h-12 px-5 rounded-full bg-[#11141A] text-[#F3EFE6] text-sm font-semibold hover:bg-[#2A303C] cursor-pointer disabled:opacity-50"
            onClick={() => void loadIncidents()}
            disabled={isLoading || pendingIncidentId !== null}
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <p aria-live="polite" className={message ? "text-sm font-medium rounded-[20px] bg-white px-5 py-3 m-0 text-[#11141A]" : "sr-only"}>{message}</p>

      {isLoading ? (
        <p role="status" className="rounded-[32px] bg-white p-6 text-sm text-[#4A505C] m-0">Loading active incidents…</p>
      ) : incidents.length === 0 ? (
        <p className="rounded-[32px] border-2 border-dashed border-[#E8E2D3] p-8 text-center text-sm text-[#4A505C] m-0">No active incidents need authority review.</p>
      ) : (
        <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5" aria-label="Active incidents awaiting review">
          {incidents.map((incident) => {
            const isPending = pendingIncidentId === incident.id;
            const category = reportCategories[incident.category] ?? incident.category;
            const tone = categoryTone(incident.category);
            const isVerified = incident.level === "L3" || incident.level === "L5" || incident.level === "L6";
            const isCheckingSpread = spreadLoading && spreadIncidentId === incident.id;
            const isSpreadOpen = spreadIncidentId === incident.id;
            const isHighlighted = highlightedIncidentId === incident.id;

            return (
              <li
                key={incident.id}
                id={`incident-${incident.id}`}
                className={`rounded-[32px] bg-white p-5 flex flex-col gap-3.5 transition-shadow ${isSpreadOpen ? "md:col-span-2 xl:col-span-3" : ""} ${
                  isHighlighted ? "ring-2 ring-[#FF5B2E] shadow-[0_10px_30px_rgba(255,91,46,0.25)]" : ""
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0" style={{ background: tone.bg, color: tone.fg }}>
                    <IncidentIcon category={incident.category} size={26} className="shrink-0" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[22px] font-bold tracking-[-0.02em] leading-tight text-[#11141A] truncate">{category}</div>
                    <div className="text-sm text-[#4A505C] mt-0.5 truncate">
                      {incident.report_count} report{incident.report_count === 1 ? "" : "s"} · {formatIncidentTime(incident.first_reported_at)} IST
                    </div>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-[#11141A]">{incident.level}</span>
                </div>

                <TrustBar level={incident.level} />

                {incident.photo_data_url && (
                  <div className="relative rounded-[22px] overflow-hidden bg-[#F3EFE6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={incident.photo_data_url} alt="Citizen-submitted photo evidence for this incident" className="w-full h-[110px] object-cover" />
                    <span className="absolute left-3 bottom-2.5 h-6 px-2.5 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold">
                      <CameraIcon size={12} className="shrink-0" /> L5 · {(incident.photo_confidence ?? "moderate").toUpperCase()}
                    </span>
                  </div>
                )}

                <p className="text-xs text-[#4A505C] m-0 leading-relaxed">
                  {incident.level_reason} · <span className="font-mono">{incident.provenance}</span>
                </p>

                <div className="flex gap-2 mt-auto">
                  {incident.level !== "L6" && (
                    <button
                      type="button"
                      className="flex-1 h-[46px] rounded-full bg-[#D5F75A] text-[#11141A] text-sm font-bold hover:brightness-95 cursor-pointer disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => void updateIncident(incident, "confirm")}
                    >
                      {isPending ? "Saving…" : "Confirm L6"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`h-[46px] px-4 rounded-full bg-[#F3EFE6] text-[#11141A] text-sm font-bold hover:bg-[#E8E2D3] cursor-pointer disabled:opacity-50 ${incident.level === "L6" ? "flex-1" : ""}`}
                    disabled={isPending}
                    onClick={() => void updateIncident(incident, "resolve")}
                  >
                    {isPending ? "Saving…" : "Resolve"}
                  </button>
                  <button
                    type="button"
                    className="w-[46px] h-[46px] rounded-full bg-[#F3EFE6] text-[#11141A] flex items-center justify-center hover:bg-[#FFE3D8] hover:text-[#8F3209] cursor-pointer disabled:opacity-50 shrink-0"
                    disabled={isPending}
                    aria-label="Reject report"
                    title="Reject report"
                    onClick={() => void updateIncident(incident, "reject")}
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                {isVerified && (
                  <button
                    type="button"
                    className="h-10 rounded-full border border-[#EEE9DC] text-[#11141A] text-[13px] font-semibold hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-50"
                    disabled={isPending || isCheckingSpread}
                    onClick={() => void handleCheckSpread(incident)}
                  >
                    {isCheckingSpread ? "Checking routes…" : isSpreadOpen && spreadResult ? "Hide spread" : "Check spread from Pumpwell"}
                  </button>
                )}

                {isSpreadOpen && (
                  <div className="rounded-[22px] bg-[#F3EFE6] p-4 space-y-2.5 text-xs">
                    {spreadLoading ? (
                      <p className="text-[#4A505C] animate-pulse m-0">Checking routes from Pumpwell via OSRM…</p>
                    ) : spreadError ? (
                      <p className="text-[#B8400F] font-semibold m-0">{spreadError}</p>
                    ) : spreadResult ? (
                      <>
                        <div className="space-y-1">
                          <p className="font-display text-lg font-bold tracking-[-0.02em] text-[#11141A] m-0">
                            Affects {spreadResult.affected} of {spreadResult.checked} routes from {spreadResult.origin}.
                          </p>
                          {spreadResult.checked < spreadResult.total && (
                            <p className="text-[#B8400F] font-semibold m-0">{spreadResult.total - spreadResult.checked} routes could not be checked right now.</p>
                          )}
                          <p className="text-[11px] text-[#4A505C] m-0">This route passes within 200 metres of the verified report. Free-flow estimate.</p>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="min-w-[560px]">
                            <div className={`grid grid-cols-[1.4fr_0.8fr_1fr_0.8fr] gap-3 pb-2 border-b border-[#E3DDCE] ${monoLabel} !text-[10px] text-[#4A505C]`}>
                              <span>Destination</span><span>Affected</span><span>Avoid option</span><span className="text-right">Action</span>
                            </div>
                            {spreadResult.rows.map((row) => (
                              <div key={row.destination} className="grid grid-cols-[1.4fr_0.8fr_1fr_0.8fr] gap-3 items-center h-11 border-b border-[#E3DDCE] last:border-0 text-[13px]">
                                <span className="font-semibold text-[#11141A] truncate">{row.destination}</span>
                                <span>
                                  {!row.checked ? <span className="italic text-[#4A505C]">Unchecked</span>
                                    : row.affected ? <span className="font-bold text-[#B8400F]">Yes</span>
                                    : <span className="text-[#4A505C]">No</span>}
                                </span>
                                <span className="text-[#4A505C]">
                                  {!row.checked ? "—"
                                    : !row.affected ? "Not affected"
                                    : row.avoiding_extra_s !== null
                                    ? row.avoiding_extra_s === 0 ? "0 min extra" : `+${Math.round(row.avoiding_extra_s / 60)} min`
                                    : "No alternative"}
                                </span>
                                <span className="text-right">
                                  <Link
                                    href={`/planner?from=${encodeURIComponent(spreadResult.origin)}&to=${encodeURIComponent(row.destination)}`}
                                    className="text-[12px] font-semibold text-[#FF5B2E] hover:underline whitespace-nowrap"
                                  >
                                    Plan pair →
                                  </Link>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Authority timeline */}
      <div className="rounded-[32px] bg-white p-5" aria-labelledby="incident-timeline-title">
        <h3 id="incident-timeline-title" className="font-display text-lg font-bold tracking-[-0.02em] text-[#11141A] m-0">Recent authority timeline</h3>
        {history.length === 0 ? (
          <p className="text-xs text-[#4A505C] m-0 mt-2">No authority actions have been recorded yet.</p>
        ) : (
          <ol className="list-none m-0 p-0 mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5" aria-label="Recent authority incident actions">
            {history.map((item) => (
              <li key={item.id} className="border-l-[3px] border-[#FF5B2E] pl-3 text-[13px] text-[#4A505C]">
                <span className="font-semibold text-[#11141A]">{item.action.replace("_incident", "").replace(/^./, (letter) => letter.toUpperCase())}</span>{" "}
                {reportCategories[item.category] ?? item.category} · <span className="font-mono text-[12px]">{formatIncidentTime(item.created_at)} IST</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}