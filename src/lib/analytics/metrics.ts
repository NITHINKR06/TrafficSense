import { HISTORICAL_INCIDENTS, type HistoricalIncident } from "./history.ts";

export type HotspotRanking = {
  junction_id: string;
  junction_name: string;
  segment_id: string;
  incident_count: number;
  total_delay_hours: number;
  average_delay_minutes: number;
  max_delay_minutes: number;
  primary_cause: string;
  primary_window: string;
};

export type CauseBreakdown = {
  cause: string;
  label: string;
  count: number;
  percentage: number;
};

export type AnalyticsSummary = {
  selected_month: string;
  total_incidents: number;
  total_delay_hours: number;
  average_delay_minutes: number;
  top_hotspot: string;
  primary_cause: string;
  hotspots: HotspotRanking[];
  cause_mix: CauseBreakdown[];
  incidents: HistoricalIncident[];
};

const CAUSE_LABELS: Record<HistoricalIncident["cause"], string> = {
  accident: "Traffic Collisions",
  road_repair: "Road Maintenance / Works",
  heavy_volume: "Peak Traffic Congestion",
  flood: "Monsoon Waterlogging",
  unknown: "Unverified Incidents",
};

export function computeAnalytics(selectedMonth = "all"): AnalyticsSummary {
  const filtered = selectedMonth === "all"
    ? HISTORICAL_INCIDENTS
    : HISTORICAL_INCIDENTS.filter((inc) => inc.month === selectedMonth);

  const totalIncidents = filtered.length;
  const totalDelayMinutes = filtered.reduce((acc, inc) => acc + inc.commuter_delay_minutes, 0);
  const totalDelayHours = Math.round((totalDelayMinutes / 60) * 10) / 10;
  const averageDelayMinutes = totalIncidents > 0 ? Math.round(totalDelayMinutes / totalIncidents) : 0;

  // Group by junction for hotspots
  const byJunction = new Map<string, HistoricalIncident[]>();
  for (const inc of filtered) {
    const list = byJunction.get(inc.junction_id) ?? [];
    list.push(inc);
    byJunction.set(inc.junction_id, list);
  }

  const hotspots: HotspotRanking[] = Array.from(byJunction.entries()).map(([jid, incs]) => {
    const sumDelay = incs.reduce((acc, i) => acc + i.commuter_delay_minutes, 0);
    const maxDelay = Math.max(...incs.map((i) => i.commuter_delay_minutes));
    const avgDelay = Math.round(sumDelay / incs.length);

    // Primary cause in this junction
    const causeCounts = new Map<string, number>();
    for (const i of incs) causeCounts.set(i.cause, (causeCounts.get(i.cause) ?? 0) + 1);
    const primaryCause = Array.from(causeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

    // Primary peak window
    const windowCounts = new Map<string, number>();
    for (const i of incs) windowCounts.set(i.peak_window, (windowCounts.get(i.peak_window) ?? 0) + 1);
    const primaryWindow = Array.from(windowCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "off_peak";

    return {
      junction_id: jid,
      junction_name: incs[0].junction_name,
      segment_id: incs[0].segment_id,
      incident_count: incs.length,
      total_delay_hours: Math.round((sumDelay / 60) * 10) / 10,
      average_delay_minutes: avgDelay,
      max_delay_minutes: maxDelay,
      primary_cause: CAUSE_LABELS[primaryCause as HistoricalIncident["cause"]] ?? primaryCause,
      primary_window: primaryWindow,
    };
  }).sort((a, b) => b.total_delay_hours - a.total_delay_hours);

  // Cause breakdown
  const causeCounts = new Map<string, number>();
  for (const inc of filtered) {
    causeCounts.set(inc.cause, (causeCounts.get(inc.cause) ?? 0) + 1);
  }

  const cause_mix: CauseBreakdown[] = Array.from(causeCounts.entries()).map(([c, count]) => ({
    cause: c,
    label: CAUSE_LABELS[c as HistoricalIncident["cause"]] ?? c,
    count,
    percentage: totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const top_hotspot = hotspots[0]?.junction_name ?? "None";
  const primary_cause = cause_mix[0]?.label ?? "None";

  return {
    selected_month: selectedMonth,
    total_incidents: totalIncidents,
    total_delay_hours: totalDelayHours,
    average_delay_minutes: averageDelayMinutes,
    top_hotspot,
    primary_cause,
    hotspots,
    cause_mix,
    incidents: filtered.sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)),
  };
}
