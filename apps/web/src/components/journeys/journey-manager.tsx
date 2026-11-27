"use client";

import { useState, useTransition } from "react";
import type { CommuterJourney } from "@/lib/journeys/rules";
import {
  handleStartJourney,
  handleEndJourney,
  handleShareJourney,
  handleStopSharing,
} from "@/app/workspace/actions";

export function JourneyManager({
  journeys,
  organisations,
  initialCorridor,
}: {
  journeys: CommuterJourney[];
  organisations: Array<{ id: string; name: string }>;
  initialCorridor?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [corridorName, setCorridorName] = useState(initialCorridor || "Pumpwell – Hampankatta Central Corridor");

  const activeJourneys = journeys.filter((j) => j.status === "active");
  const pastJourneys = journeys.filter((j) => j.status === "ended");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#11141A] m-0">On the road</h2>
          <p className="text-sm text-[#4A505C] mt-1 mb-0">
            Start and stop a private journey, then explicitly share its corridor and status with an employer. Delay is not measured yet.
          </p>
        </div>
        <input
          type="text"
          value={corridorName}
          onChange={(e) => setCorridorName(e.target.value)}
          maxLength={120}
          aria-label="Corridor name"
          className="h-11 text-sm px-4 rounded-full border border-[#EEE9DC] bg-[#F3EFE6] text-[#11141A] font-medium w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#11141A]"
        />
        <button
          type="button"
          disabled={isPending || corridorName.trim().length === 0}
          onClick={() => {
            startTransition(async () => {
              await handleStartJourney(corridorName.trim());
            });
          }}
          className="h-11 px-5 rounded-full whitespace-nowrap bg-[#FF5B2E] text-[#11141A] text-xs font-bold hover:brightness-95 transition cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Starting..." : "+ Start New Journey"}
        </button>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-[#11141A] mb-3">Active Journeys ({activeJourneys.length})</h3>
        {activeJourneys.length === 0 ? (
          <p className="text-sm text-[#4A505C] italic p-5 rounded-[24px] bg-[#F8F5EE] border border-dashed border-[#DCD5C4]">
            No active journeys in progress. Click &quot;Start New Journey&quot; to begin.
          </p>
        ) : (
          <div className="space-y-4">
            {activeJourneys.map((j) => (
              <div
                key={j.id}
                className="p-6 rounded-[28px] border border-[#EEE9DC] bg-[#F8F5EE] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEE9DC] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-6 px-2.5 rounded-full inline-flex items-center font-mono text-[10px] font-bold bg-[#D5F75A] text-[#11141A]">
                        ACTIVE JOURNEY
                      </span>
                      <span className="text-xs font-mono text-[#4A505C]">
                        ID: {j.id.slice(0, 8)}...
                      </span>
                    </div>
                    <p className="font-display font-bold text-base text-[#11141A] mt-1.5 mb-0">{j.corridor_name}</p>
                  </div>
                  <form action={handleEndJourney}>
                    <input type="hidden" name="journeyId" value={j.id} />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="h-9 px-4 rounded-full bg-[#FFE3D8] text-[#8F3209] text-xs font-bold hover:brightness-95 transition cursor-pointer disabled:opacity-50"
                    >
                      End Journey
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-surface-on-variant block">Delay measurement</span>
                    <span className="font-semibold text-surface-on">Not measured</span>
                  </div>
                  <div>
                    <span className="text-xs text-surface-on-variant block">Journey evidence</span>
                    <span className="font-semibold text-surface-on">Not collected</span>
                  </div>
                  <div>
                    <span className="text-xs text-surface-on-variant block">Started at</span>
                    <span className="font-mono text-xs">
                      {new Date(j.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Consent-based employer sharing */}
                <div className="pt-3 border-t border-surface-container space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-on-variant">
                      Employer Sharing Consent
                    </h4>
                    <span className="text-xs text-surface-on-variant">
                      {j.shares?.filter((s) => s.status === "active").length || 0} active share(s)
                    </span>
                  </div>

                  {/* Active shares list */}
                  {j.shares && j.shares.filter((s) => s.status === "active").length > 0 && (
                    <div className="space-y-2">
                      {j.shares
                        .filter((s) => s.status === "active")
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-2.5 rounded bg-surface-container text-xs"
                          >
                            <div>
                              <span className="font-bold text-surface-on">{s.org_name}</span>
                              <span className="text-surface-on-variant block">
                                Shared {new Date(s.shared_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <form action={handleStopSharing}>
                              <input type="hidden" name="journeyId" value={j.id} />
                              <input type="hidden" name="orgId" value={s.org_id} />
                              <button
                                type="submit"
                                disabled={isPending}
                                className="h-8 px-3.5 rounded-full bg-[#FFE3D8] text-[#8F3209] text-xs font-semibold hover:brightness-95 transition cursor-pointer"
                              >
                                Stop Sharing
                              </button>
                            </form>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* New share form or empty state */}
                  {organisations.length > 0 ? (
                    <form
                      action={handleShareJourney}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
                    >
                      <input type="hidden" name="journeyId" value={j.id} />
                      <select
                        name="orgId"
                        required
                        className="h-10 text-xs px-4 rounded-full bg-white border border-[#EEE9DC] text-[#11141A] font-medium flex-1"
                      >
                        <option value="">Select organisation to share journey status...</option>
                        {organisations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="h-10 px-5 rounded-full bg-[#11141A] text-[#F3EFE6] text-xs font-semibold whitespace-nowrap hover:bg-[#2A303C] transition cursor-pointer disabled:opacity-50"
                      >
                        Consent &amp; Share
                      </button>
                    </form>
                  ) : (
                    <div className="p-3.5 rounded-[20px] bg-white border border-[#EEE9DC] text-xs text-[#4A505C] flex items-center justify-between gap-2">
                      <span>No affiliated employer found to share with.</span>
                      <span className="font-mono text-[10px] uppercase font-semibold text-[#4A505C]">Unlinked account</span>
                    </div>
                  )}
                  <p className="text-[11px] text-surface-on-variant">
                    Privacy Guarantee: Only corridor and current journey status are shared. Delay is not measured. Exact coordinates, GPS, route history, and device identity are NEVER disclosed.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pastJourneys.length > 0 && (
        <div className="pt-4 border-t border-surface-container">
          <h3 className="text-md font-bold mb-3 text-surface-on-variant">Past Journeys ({pastJourneys.length})</h3>
          <div className="space-y-2">
            {pastJourneys.map((j) => (
              <div
                key={j.id}
                className="p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 opacity-80"
              >
                <div>
                  <span className="font-semibold text-surface-on">{j.corridor_name}</span>
                  <span className="text-surface-on-variant block">
                    Started {new Date(j.started_at).toLocaleTimeString()} · Ended {j.ended_at ? new Date(j.ended_at).toLocaleTimeString() : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-surface-on-variant font-mono">
                    ENDED
                  </span>
                  <span className="font-medium text-surface-on">Delay not measured</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
