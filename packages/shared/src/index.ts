export type TrafficEvidenceLevel = "L1" | "L2" | "L3" | "L4";

export type IncidentStatus = "active" | "recovering" | "cleared" | "stale";

export type MobileIncidentSummary = {
  id: string;
  status: IncidentStatus;
  evidence_level: TrafficEvidenceLevel | null;
  report_count: number;
  observed_at: string;
  category: string;
};
