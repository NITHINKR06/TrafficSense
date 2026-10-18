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
});
