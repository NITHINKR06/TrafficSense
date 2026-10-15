import type { TrafficFixture } from "./simulator";
import { sampleFreshness, type TrafficSnapshot } from "./snapshot.ts";

export type SnapshotClock = { snapshot: TrafficSnapshot; elapsedMs: number };

export function snapshotReadTime(snapshot: TrafficSnapshot, clock: SnapshotClock | null) {
  const elapsedMs = clock?.snapshot === snapshot ? clock.elapsedMs : 0;
  return new Date(Date.parse(snapshot.read_at) + elapsedMs).toISOString();
}

export function snapshotFreshness(observedAt: string | null, readAt: string, elapsedMs: number | null) {
  if (observedAt === null) return "missing";
  // An upper-bound clock may expire evidence early, but cannot promote future evidence.
  if (sampleFreshness(observedAt, readAt) === "future") return "future";
  if (elapsedMs === null || !Number.isFinite(elapsedMs) || elapsedMs < 0) return "unknown";
  return sampleFreshness(observedAt, new Date(Date.parse(readAt) + elapsedMs).toISOString());
}

export function resolveSegment(fixture: TrafficFixture, requestedIds: string[]) {
  if (requestedIds.length > 1) return null;
  const id = requestedIds.length ? requestedIds[0] : "primary-west";
  return fixture.segments.find(segment => segment.id === id) ?? null;
}

export function latestSegmentSamples(fixture: TrafficFixture, segmentId: string) {
  const observations = fixture.observations.filter(row => row.segment_id === segmentId);
  const latest = observations.reduce((time, row) => Math.max(time, Date.parse(row.observed_at)), -Infinity);
  return {
    observedAt: Number.isFinite(latest) ? new Date(latest).toISOString() : null,
    samples: observations.filter(row => Date.parse(row.observed_at) === latest).sort((a, b) => a.source_id.localeCompare(b.source_id)),
  };
}

export function formatTrafficTime(value: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(new Date(value))} · Asia/Kolkata`;
}
