import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportCategory } from "@/lib/reports/rules";

export type LiveIncident = {
  id: string;
  category: ReportCategory;
  lat: number;
  lng: number;
  status: "open" | "resolved" | "expired";
  level: "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
  level_reason: string;
  first_reported_at: string;
  last_confirmed_at: string;
  provenance: "reported" | "verified" | "authority";
  report_count: number;
};

export type SubmitIncidentInput = {
  category: ReportCategory;
  lat: number;
  lng: number;
  gps_accuracy_m?: number | null;
  gps_fix_at?: string | null;
  note?: string | null;
};

export type SubmitIncidentResult =
  | { ok: true; incident_id: string; level: string; level_reason: string; distinct_reporters?: number }
  | { ok: false; error: string };

/**
 * Submits an incident report from a user, automatically clustering with existing
 * incidents within 300m and evaluating the L1-L3 verification ladder.
 */
export async function submitIncidentReport(
  supabase: SupabaseClient,
  input: SubmitIncidentInput
): Promise<SubmitIncidentResult> {
  const { data, error } = await supabase.rpc("submit_live_incident_report", {
    p_category: input.category,
    p_lat: input.lat,
    p_lng: input.lng,
    p_gps_accuracy_m: input.gps_accuracy_m ?? null,
    p_gps_fix_at: input.gps_fix_at ?? null,
    p_note: input.note ?? null,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to submit incident report" };
  }

  return data as SubmitIncidentResult;
}

/**
 * Reads all currently active, non-expired live incidents.
 */
export async function getActiveLiveIncidents(
  supabase: SupabaseClient
): Promise<LiveIncident[]> {
  const { data, error } = await supabase.rpc("read_active_live_incidents");
  if (error || !Array.isArray(data)) {
    return [];
  }
  return data as LiveIncident[];
}

/**
 * Allows a traffic authority to confirm (L6) or resolve an incident.
 */
export async function authorityUpdateIncident(
  supabase: SupabaseClient,
  incidentId: string,
  action: "confirm" | "resolve"
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("authority_update_incident", {
    p_incident_id: incidentId,
    p_action: action,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? `Failed to ${action} incident` };
  }

  return { ok: true };
}
