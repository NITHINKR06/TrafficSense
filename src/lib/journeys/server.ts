import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommuterJourney, EmployerSharedJourney } from "./rules";

export async function getCommuterJourneys(supabase: SupabaseClient): Promise<CommuterJourney[]> {
  const { data: journeys, error } = await supabase
    .from("commuter_journeys")
    .select(`
      id,
      corridor_id,
      corridor_name,
      status,
      started_at,
      ended_at,
      estimated_delay_seconds,
      evidence_level,
      provenance
    `)
    .order("started_at", { ascending: false });

  if (error || !journeys) {
    return [];
  }

  const { data: shares } = await supabase
    .from("journey_employer_shares")
    .select("id, journey_id, org_id, status, shared_at, stopped_at, provenance");

  const { data: orgs } = await supabase.from("organisations").select("id, name");
  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  return journeys.map((j) => ({
    ...j,
    shares: (shares ?? [])
      .filter((s) => s.journey_id === j.id)
      .map((s) => ({
        ...s,
        org_name: orgMap.get(s.org_id) ?? "Unknown Organisation",
      })),
  }));
}

export async function startCommuterJourney(
  supabase: SupabaseClient,
  corridorName = "Mangaluru Central Demonstration Corridor"
): Promise<{ ok: boolean; journeyId?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Authentication required" };

  const { data, error } = await supabase
    .from("commuter_journeys")
    .insert({
      user_id: user.id,
      corridor_id: "mangaluru-central-v1",
      corridor_name: corridorName,
      status: "active",
      estimated_delay_seconds: 480, // simulated 8-minute delay demonstration
      evidence_level: "L3",
      provenance: "simulated",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to start journey" };
  }
  return { ok: true, journeyId: data.id };
}

export async function endCommuterJourney(
  supabase: SupabaseClient,
  journeyId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("commuter_journeys")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", journeyId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function shareJourneyWithEmployer(
  supabase: SupabaseClient,
  journeyId: string,
  orgId: string
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Authentication required" };

  const { error } = await supabase.from("journey_employer_shares").upsert(
    {
      journey_id: journeyId,
      org_id: orgId,
      user_id: user.id,
      status: "active",
      shared_at: new Date().toISOString(),
      stopped_at: null,
      provenance: "simulated",
    },
    { onConflict: "journey_id,org_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function stopSharingJourneyWithEmployer(
  supabase: SupabaseClient,
  journeyId: string,
  orgId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("journey_employer_shares")
    .update({ status: "stopped", stopped_at: new Date().toISOString() })
    .eq("journey_id", journeyId)
    .eq("org_id", orgId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getEmployerSharedJourneys(
  supabase: SupabaseClient,
  orgId: string
): Promise<EmployerSharedJourney[]> {
  const { data, error } = await supabase.rpc("read_employer_shared_journeys", {
    p_org_id: orgId,
  });

  if (error || !Array.isArray(data)) {
    return [];
  }
  return data as EmployerSharedJourney[];
}

export async function getAvailableOrganisations(
  supabase: SupabaseClient
): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase.from("organisations").select("id, name").order("name");
  return data ?? [];
}
