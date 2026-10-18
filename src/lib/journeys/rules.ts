export type CommuterJourney = {
  id: string;
  corridor_id: string;
  corridor_name: string;
  status: "active" | "ended";
  started_at: string;
  ended_at: string | null;
  estimated_delay_seconds: number;
  evidence_level: "L1" | "L2" | "L3" | "L4";
  provenance: "simulated";
  shares?: JourneyShare[];
};

export type JourneyShare = {
  id: string;
  journey_id: string;
  org_id: string;
  org_name?: string;
  status: "active" | "stopped";
  shared_at: string;
  stopped_at: string | null;
  provenance: "simulated";
};

export type EmployerSharedJourney = {
  journey_id: string;
  corridor_name: string;
  status: "active" | "ended";
  estimated_delay_seconds: number;
  evidence_level: "L1" | "L2" | "L3" | "L4";
  shared_at: string;
  provenance: "simulated";
};

export function formatJourneyDuration(seconds: number): string {
  if (seconds <= 0) return "No estimated delay";
  const minutes = Math.round(seconds / 60);
  return `~${minutes} min delay (${seconds}s)`;
}
