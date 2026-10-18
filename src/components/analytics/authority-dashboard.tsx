"use client";

import { useState, useMemo } from "react";
import { computeAnalytics } from "@/lib/analytics/metrics";

export function AuthorityDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("all");

  const data = useMemo(() => computeAnalytics(selectedMonth), [selectedMonth]);

  function exportCsv() {
    const headers = [
      "Incident ID",
      "Junction Name",
      "Segment ID",
      "Direction",
      "Occurred At (UTC)",
      "Duration (Minutes)",
      "Commuter Delay (Minutes)",
      "Cause",
      "Peak Window",
      "Provenance",
    ];

    const rows = data.incidents.map((i) => [
      i.id,
      `"${i.junction_name}"`,
      i.segment_id,
      i.direction,
      i.occurred_at,
      i.duration_minutes,
      i.commuter_delay_minutes,
      i.cause,
      i.peak_window,
      i.provenance,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mangaluru-traffic-analytics-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Month Filter & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container">
        <div>
          <span className="text-xs uppercase font-bold text-surface-on-variant">Analysis Period</span>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-2 text-sm rounded-lg bg-surface-container border border-surface-container-high text-surface-on font-semibold"
            >
              <option value="all">All Months (July – October 2026)</option>
              <option value="2026-10">October 2026 (Recent)</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026 (Monsoon Peak)</option>
              <option value="2026-07">July 2026</option>
            </select>
            <span className="text-xs text-surface-on-variant">
              ({data.total_incidents} incidents analyzed)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="button text-xs px-3 py-2 rounded-lg bg-secondary text-secondary-on font-semibold hover:opacity-90 flex items-center gap-1.5"
        >
          <span>↓ Export CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
          <span className="text-xs text-surface-on-variant block">Total Incidents</span>
          <span className="text-2xl font-bold text-surface-on mt-1 block">{data.total_incidents}</span>
          <span className="text-[11px] text-surface-on-variant">Synthetic verified observations</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
          <span className="text-xs text-surface-on-variant block">Total Commuter Delay</span>
          <span className="text-2xl font-bold text-warning-on-container mt-1 block">
            {data.total_delay_hours} hrs
          </span>
          <span className="text-[11px] text-surface-on-variant">Summed simulated excess time</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
          <span className="text-xs text-surface-on-variant block">Top Congested Hotspot</span>
          <span className="text-lg font-bold text-primary mt-1 block truncate" title={data.top_hotspot}>
            {data.top_hotspot}
          </span>
          <span className="text-[11px] text-surface-on-variant">Highest delay concentration</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
          <span className="text-xs text-surface-on-variant block">Primary Cause</span>
          <span className="text-lg font-bold text-surface-on mt-1 block truncate" title={data.primary_cause}>
            {data.primary_cause}
          </span>
          <span className="text-[11px] text-surface-on-variant">Most frequent trigger</span>
        </div>
      </div>

      {/* Hotspots Ranking Table */}
      <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-surface-on">Corridor Hotspot Rankings</h2>
            <p className="text-xs text-surface-on-variant">
              Junctions prioritized by total commuter delay-hours and recurrence frequency.
            </p>
          </div>
          <span className="text-xs font-mono text-primary font-bold">SORT: TOTAL DELAY (DESC)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container text-surface-on-variant">
                <th className="py-2.5 px-3"># Rank</th>
                <th className="py-2.5 px-3">Junction</th>
                <th className="py-2.5 px-3">Total Delay</th>
                <th className="py-2.5 px-3">Incidents</th>
                <th className="py-2.5 px-3">Avg Delay</th>
                <th className="py-2.5 px-3">Peak Window</th>
                <th className="py-2.5 px-3">Predominant Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {data.hotspots.map((h, index) => (
                <tr key={h.junction_id} className="hover:bg-surface-container-low transition">
                  <td className="py-3 px-3 font-mono font-bold text-primary">#{index + 1}</td>
                  <td className="py-3 px-3 font-semibold text-surface-on">{h.junction_name}</td>
                  <td className="py-3 px-3 font-bold text-warning-on-container">{h.total_delay_hours} hrs</td>
                  <td className="py-3 px-3">{h.incident_count} events</td>
                  <td className="py-3 px-3">~{h.average_delay_minutes} min</td>
                  <td className="py-3 px-3 font-mono">{h.primary_window}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded bg-surface-container text-surface-on font-medium">
                      {h.primary_cause}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cause Mix & Breakdown */}
      <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-surface-on">Incident Cause Distribution</h2>
          <p className="text-xs text-surface-on-variant">
            Relative frequency of contributing factors across the selected analysis window.
          </p>
        </div>

        <div className="space-y-3">
          {data.cause_mix.map((c) => (
            <div key={c.cause} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-surface-on">{c.label}</span>
                <span className="font-mono text-surface-on-variant">
                  {c.count} incidents ({c.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.max(c.percentage, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident History Log */}
      <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-surface-on">Historical Incident Log</h2>
          <span className="text-xs text-surface-on-variant">Timestamps displayed in Asia/Kolkata</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-surface-container-lowest border-b border-surface-container">
              <tr className="text-surface-on-variant">
                <th className="py-2 px-3">Date / Time (IST)</th>
                <th className="py-2 px-3">Junction</th>
                <th className="py-2 px-3">Direction</th>
                <th className="py-2 px-3">Cause</th>
                <th className="py-2 px-3">Delay</th>
                <th className="py-2 px-3">Duration</th>
                <th className="py-2 px-3">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {data.incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-surface-container-low transition">
                  <td className="py-2 px-3 font-mono">
                    {new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hourCycle: "h23",
                    }).format(new Date(inc.occurred_at))}
                  </td>
                  <td className="py-2 px-3 font-medium">{inc.junction_name}</td>
                  <td className="py-2 px-3 capitalize">{inc.direction}</td>
                  <td className="py-2 px-3 capitalize">{inc.cause.replace("_", " ")}</td>
                  <td className="py-2 px-3 font-bold text-warning-on-container">{inc.commuter_delay_minutes} min</td>
                  <td className="py-2 px-3">{inc.duration_minutes} min</td>
                  <td className="py-2 px-3">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container">
                      SIMULATED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
