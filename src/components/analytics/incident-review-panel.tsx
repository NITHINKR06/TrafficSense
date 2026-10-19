"use client";

import { useCallback, useEffect, useState } from "react";
import { reportCategories, reportCategoryIcons } from "@/lib/reports/rules";
import type { LiveIncident } from "@/lib/incidents/server";

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

export function IncidentReviewPanel() {
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIncidentId, setPendingIncidentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchIncidents = useCallback(async (): Promise<LiveIncident[]> => {
    const response = await fetch("/api/incidents", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok || !Array.isArray(data.incidents)) {
      throw new Error("Unable to load active incidents.");
    }
    return data.incidents;
  }, []);

  useEffect(() => {
    let active = true;
    void fetchIncidents()
      .then((loaded) => {
        if (active) setIncidents(loaded);
      })
      .catch(() => {
        if (active) setMessage("Active incidents could not be loaded. Refresh to retry.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchIncidents]);

  async function loadIncidents() {
    setIsLoading(true);
    setMessage(null);
    try {
      setIncidents(await fetchIncidents());
    } catch {
      setMessage("Active incidents could not be loaded. Refresh to retry.");
    } finally {
      setIsLoading(false);
    }
  }

  async function updateIncident(incident: LiveIncident, action: "confirm" | "resolve") {
    const actionLabel = action === "confirm" ? "confirm" : "resolve";
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
      setMessage(action === "confirm" ? "Incident marked as authority-confirmed (L6)." : "Incident resolved and removed from active review.");
      await loadIncidents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this incident.");
    } finally {
      setPendingIncidentId(null);
    }
  }

  return (
    <section className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm space-y-3" aria-labelledby="incident-review-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="incident-review-title" className="text-base font-bold text-surface-on">Active Incident Review</h2>
          <p className="text-xs text-surface-on-variant">Confirming records an L6 authority decision; resolving removes the incident from public active views. Reported cause and congestion evidence remain separate.</p>
        </div>
        <button type="button" className="button secondary text-xs px-3 py-1.5" onClick={() => void loadIncidents()} disabled={isLoading || pendingIncidentId !== null}>
          {isLoading ? "Refreshing…" : "Refresh incidents"}
        </button>
      </div>

      <p aria-live="polite" className={message ? "text-xs rounded-lg bg-surface-container-low p-3 text-surface-on" : "sr-only"}>{message}</p>

      {isLoading ? (
        <p role="status" className="text-sm text-surface-on-variant">Loading active incidents…</p>
      ) : incidents.length === 0 ? (
        <p className="text-sm text-surface-on-variant rounded-lg border border-dashed border-surface-container p-4">No active incidents need authority review.</p>
      ) : (
        <ul className="space-y-3" aria-label="Active incidents awaiting review">
          {incidents.map((incident) => {
            const isPending = pendingIncidentId === incident.id;
            const category = reportCategories[incident.category] ?? incident.category;
            return (
              <li key={incident.id} className="rounded-lg border border-surface-container bg-surface-container-low p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-surface-on">{reportCategoryIcons[incident.category] ?? "⚠️"} {category}</p>
                  <span className="text-[10px] font-mono rounded bg-surface-container-high px-2 py-0.5 text-surface-on-variant">{incident.level} · {incident.provenance}</span>
                </div>
                <p className="text-xs text-surface-on-variant">{incident.level_reason} · {incident.report_count} report{incident.report_count === 1 ? "" : "s"} · first reported {formatIncidentTime(incident.first_reported_at)} IST</p>
                <div className="flex flex-wrap gap-2">
                  {incident.level !== "L6" && <button type="button" className="button text-xs px-3 py-1.5" disabled={isPending} onClick={() => void updateIncident(incident, "confirm")}>{isPending ? "Saving…" : "Confirm (L6)"}</button>}
                  <button type="button" className="button secondary text-xs px-3 py-1.5" disabled={isPending} onClick={() => void updateIncident(incident, "resolve")}>{isPending ? "Saving…" : "Resolve incident"}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
