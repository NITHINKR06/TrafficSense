export type TrafficEvidenceLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
export type IncidentStatus = "open" | "resolved" | "expired";
export type IncidentProvenance = "reported" | "verified" | "authority";

export type LiveIncident = {
  id: string;
  category: string;
  lat: number;
  lng: number;
  status: IncidentStatus;
  level: TrafficEvidenceLevel;
  level_reason: string;
  first_reported_at: string;
  last_confirmed_at: string;
  provenance: IncidentProvenance;
  report_count: number;
};

export type ActiveIncidentsResponse =
  | { ok: true; incidents: LiveIncident[] }
  | { ok: false; error: string };
