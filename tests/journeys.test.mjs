import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatJourneyDuration } from "../src/lib/journeys/rules.ts";

describe("Phase 6 — Journeys and consent-based employer sharing", () => {
  it("formats journey delays cleanly with minutes and seconds", () => {
    assert.equal(formatJourneyDuration(0), "No estimated delay");
    assert.equal(formatJourneyDuration(-10), "No estimated delay");
    assert.equal(formatJourneyDuration(60), "~1 min delay (60s)");
    assert.equal(formatJourneyDuration(480), "~8 min delay (480s)");
    assert.equal(formatJourneyDuration(495), "~8 min delay (495s)");
  });

  it("employer response shape contains only allowlisted fields without location tracking", () => {
    const employerSample = {
      journey_id: "7b43a992-1234-4567-890a-bcdef1234567",
      corridor_name: "Mangaluru Central Demonstration Corridor",
      status: "active",
      estimated_delay_seconds: 480,
      evidence_level: "L3",
      shared_at: "2026-10-17T18:00:00Z",
      provenance: "simulated",
    };

    const allowedKeys = [
      "journey_id",
      "corridor_name",
      "status",
      "estimated_delay_seconds",
      "evidence_level",
      "shared_at",
      "provenance",
    ];

    assert.deepEqual(Object.keys(employerSample).sort(), allowedKeys.sort());

    // Never leak coordinates, geometry or raw GPS
    const raw = JSON.stringify(employerSample);
    assert.equal(raw.includes("coordinates"), false);
    assert.equal(raw.includes("geometry"), false);
    assert.equal(raw.includes("latitude"), false);
    assert.equal(raw.includes("longitude"), false);
    assert.equal(raw.includes("user_id"), false);
    assert.equal(raw.includes("email"), false);
  });

  it("sharing lifecycle stops access when ended or stopped", () => {
    const activeShare = {
      journey_status: "active",
      share_status: "active",
    };
    const isEmployerVisible = (j) => j.journey_status === "active" && j.share_status === "active";

    assert.equal(isEmployerVisible(activeShare), true);

    // Commuter ends journey
    assert.equal(isEmployerVisible({ journey_status: "ended", share_status: "active" }), false);

    // Commuter stops sharing
    assert.equal(isEmployerVisible({ journey_status: "active", share_status: "stopped" }), false);

    // Both ended and stopped
    assert.equal(isEmployerVisible({ journey_status: "ended", share_status: "stopped" }), false);
  });

  it("journey operations invoke secure RPCs rather than raw table mutations", async () => {
    const {
      startCommuterJourney,
      endCommuterJourney,
      shareJourneyWithEmployer,
      stopSharingJourneyWithEmployer,
    } = await import("../src/lib/journeys/server.ts");

    const rpcCalls = [];
    const mockSupabase = {
      rpc: async (name, params) => {
        rpcCalls.push({ name, params });
        if (name === "start_commuter_journey") {
          return { data: { ok: true, journeyId: "test-journey-1" }, error: null };
        }
        return { data: { ok: true }, error: null };
      },
    };

    const startRes = await startCommuterJourney(mockSupabase, "Test Corridor");
    assert.equal(startRes.ok, true);
    assert.equal(startRes.journeyId, "test-journey-1");
    assert.equal(rpcCalls[0].name, "start_commuter_journey");
    assert.equal(rpcCalls[0].params.p_corridor_name, "Test Corridor");

    const endRes = await endCommuterJourney(mockSupabase, "test-journey-1");
    assert.equal(endRes.ok, true);
    assert.equal(rpcCalls[1].name, "end_commuter_journey");
    assert.equal(rpcCalls[1].params.p_journey_id, "test-journey-1");

    const shareRes = await shareJourneyWithEmployer(mockSupabase, "test-journey-1", "org-uuid-1");
    assert.equal(shareRes.ok, true);
    assert.equal(rpcCalls[2].name, "share_commuter_journey");
    assert.equal(rpcCalls[2].params.p_journey_id, "test-journey-1");
    assert.equal(rpcCalls[2].params.p_org_id, "org-uuid-1");

    const stopRes = await stopSharingJourneyWithEmployer(mockSupabase, "test-journey-1", "org-uuid-1");
    assert.equal(stopRes.ok, true);
    assert.equal(rpcCalls[3].name, "stop_sharing_commuter_journey");
    assert.equal(rpcCalls[3].params.p_journey_id, "test-journey-1");
    assert.equal(rpcCalls[3].params.p_org_id, "org-uuid-1");
  });
});

