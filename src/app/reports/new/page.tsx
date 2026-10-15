import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/reports/report-form";
import { RefreshTraffic } from "@/components/traffic/refresh-traffic";
import { readTrafficSnapshot } from "@/lib/traffic/server";
import { resolveSegment } from "@/lib/traffic/presentation";

export const metadata: Metadata = { title: "Report a simulated road problem · TrafficSense Mangaluru" };

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ segment?: string | string[] }> }) {
  const params = await searchParams;
  const result = await readTrafficSnapshot();
  const snapshot = result.status === "ready" ? result.snapshot : null;
  const segmentValues = params.segment === undefined ? [] : Array.isArray(params.segment) ? params.segment : [params.segment];
  const selected = snapshot?.fixture ? resolveSegment(snapshot.fixture, segmentValues) : null;
  return <section>
    <p className="simulated-pill">SIMULATED · Reporting demonstration</p>
    <h1>Report a simulated road problem</h1>
    <p className="intro">Try a report without claiming a real incident. No device location, photo, journey or employer sharing is collected.</p>
    {snapshot?.fixture && selected && snapshot.reporting_enabled ? <ReportForm segments={snapshot.fixture.segments} selectedId={selected.id} /> :
      <div className="panel" role="status">
        <h2>{result.status === "unconfigured" ? "Reporting is not configured" : !snapshot ? "Traffic data is unavailable"
          : !snapshot.fixture ? "No demonstration corridor is loaded" : !selected ? "Segment not found" : "Demo reporting is disabled"}</h2>
        <p>{!selected && snapshot?.fixture ? "Choose one valid directed segment from the traffic page. Duplicate or unknown selections are not accepted."
          : "A valid demonstration corridor and enabled reporting are required before preparing a report. Browsing does not create an account or guest identity."}</p>
        <RefreshTraffic />
      </div>}
    <div className="actions section-space">
      <Link href={selected ? `/traffic?segment=${encodeURIComponent(selected.id)}` : "/traffic"}>Back to traffic</Link>
      <Link href="/demo">Guest introduction</Link>
    </div>
  </section>;
}
