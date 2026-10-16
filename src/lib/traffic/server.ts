import "server-only";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { parseTrafficSnapshot, type TrafficSnapshot } from "./snapshot";
import { assessSlowdown, type SlowdownAssessment } from "../evidence/slowdown.ts";

export type TrafficSnapshotResult =
  | { status: "ready"; snapshot: TrafficSnapshot; slowdown_assessments: SlowdownAssessment[] }
  | { status: "unconfigured" | "unavailable" | "invalid" | "denied" };

const trafficFetch: typeof fetch = (input, init) => fetch(input, {
  ...init,
  cache: "no-store",
  signal: init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)])
    : AbortSignal.timeout(8000),
});

export async function readTrafficSnapshot(): Promise<TrafficSnapshotResult> {
  await connection();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return { status: "unconfigured" };
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: trafficFetch },
    });
    const { data, error, status } = await client.rpc("read_traffic_demo");
    if (error) {
      return { status: error.code === "42501" || status === 401 || status === 403 ? "denied" : "unavailable" };
    }
    try {
      const snapshot = parseTrafficSnapshot(data);
      return { status: "ready", snapshot, slowdown_assessments: assessSlowdown(snapshot) };
    } catch {
      return { status: "invalid" };
    }
  } catch {
    return { status: "unavailable" };
  }
}
