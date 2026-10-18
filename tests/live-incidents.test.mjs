import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  submitIncidentReport,
  getActiveLiveIncidents,
  authorityUpdateIncident,
} from "../src/lib/incidents/server.ts";

describe("Plan 4 (revised) – Live Incident Reporting and Verification RPCs", () => {
  it("submitIncidentReport invokes submit_live_incident_report RPC", async () => {
    const rpcCalls = [];
    const mockSupabase = {
      rpc: async (name, params) => {
        rpcCalls.push({ name, params });
        return {
          data: {
            ok: true,
            incident_id: "inc-uuid-1",
            level: "L1",
            level_reason: "Report submitted by commuter (unconfirmed)",
          },
          error: null,
        };
      },
    };

    const res = await submitIncidentReport(mockSupabase, {
      category: "accident",
      lat: 12.871,
      lng: 74.842,
      gps_accuracy_m: 15.0,
      gps_fix_at: "2026-10-18T14:00:00Z",
      note: "Near signal",
    });

    assert.equal(res.ok, true);
    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].name, "submit_live_incident_report");
    assert.equal(rpcCalls[0].params.p_category, "accident");
    assert.equal(rpcCalls[0].params.p_lat, 12.871);
    assert.equal(rpcCalls[0].params.p_lng, 74.842);
    assert.equal(rpcCalls[0].params.p_gps_accuracy_m, 15.0);
    assert.equal(rpcCalls[0].params.p_note, "Near signal");
  });

  it("getActiveLiveIncidents invokes read_active_live_incidents RPC", async () => {
    const rpcCalls = [];
    const mockIncidents = [
      {
        id: "inc-1",
        category: "accident",
        lat: 12.87,
        lng: 74.84,
        status: "open",
        level: "L3",
        level_reason: "Verified by 3 independent commuters",
        first_reported_at: "2026-10-18T13:45:00Z",
        last_confirmed_at: "2026-10-18T13:55:00Z",
        provenance: "verified",
        report_count: 3,
      },
    ];

    const mockSupabase = {
      rpc: async (name) => {
        rpcCalls.push({ name });
        return { data: mockIncidents, error: null };
      },
    };

    const incidents = await getActiveLiveIncidents(mockSupabase);
    assert.equal(incidents.length, 1);
    assert.equal(incidents[0].id, "inc-1");
    assert.equal(incidents[0].level, "L3");
    assert.equal(rpcCalls[0].name, "read_active_live_incidents");
  });

  it("authorityUpdateIncident invokes authority_update_incident RPC for confirm and resolve", async () => {
    const rpcCalls = [];
    const mockSupabase = {
      rpc: async (name, params) => {
        rpcCalls.push({ name, params });
        return { data: { ok: true }, error: null };
      },
    };

    const confirmRes = await authorityUpdateIncident(mockSupabase, "inc-1", "confirm");
    assert.equal(confirmRes.ok, true);
    assert.equal(rpcCalls[0].name, "authority_update_incident");
    assert.equal(rpcCalls[0].params.p_incident_id, "inc-1");
    assert.equal(rpcCalls[0].params.p_action, "confirm");

    const resolveRes = await authorityUpdateIncident(mockSupabase, "inc-1", "resolve");
    assert.equal(resolveRes.ok, true);
    assert.equal(rpcCalls[1].name, "authority_update_incident");
    assert.equal(rpcCalls[1].params.p_incident_id, "inc-1");
    assert.equal(rpcCalls[1].params.p_action, "resolve");
  });
});
