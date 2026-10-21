import type {
  ActiveIncidentsResponse,
  LiveIncident,
  ReportCategory,
  RouteCoordinate,
  RouteOption,
  RouteResponse,
  SubmitIncidentResponse,
} from "@trafficsense/shared";
import { MobileApiError, requestJson } from "./request";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseErrorPayload(value: unknown): { ok: false; error: string } | null {
  if (!isRecord(value) || value.ok !== false || typeof value.error !== "string") return null;
  return { ok: false, error: value.error };
}

export function parseActiveIncidentsResponse(value: unknown): ActiveIncidentsResponse {
  const error = parseErrorPayload(value);
  if (error) return error;
  if (!isRecord(value) || value.ok !== true || !Array.isArray(value.incidents)) {
    throw new Error("Traffic service returned an invalid response.");
  }
  const incidents = value.incidents.filter((incident): incident is LiveIncident => {
    if (!isRecord(incident)) return false;
    return typeof incident.id === "string" && typeof incident.category === "string" &&
      typeof incident.lat === "number" && Number.isFinite(incident.lat) &&
      typeof incident.lng === "number" && Number.isFinite(incident.lng) &&
      typeof incident.status === "string" && typeof incident.level === "string" &&
      typeof incident.level_reason === "string" && typeof incident.first_reported_at === "string" &&
      typeof incident.last_confirmed_at === "string" && typeof incident.provenance === "string" &&
      typeof incident.report_count === "number" && Number.isInteger(incident.report_count) && incident.report_count >= 0;
  });
  if (incidents.length !== value.incidents.length) throw new Error("Traffic service returned an invalid response.");
  return { ok: true, incidents };
}

export function parseSubmitIncidentResponse(value: unknown): SubmitIncidentResponse {
  const error = parseErrorPayload(value);
  if (error) return error;
  if (!isRecord(value) || value.ok !== true || typeof value.incident_id !== "string" ||
      typeof value.level !== "string" || typeof value.level_reason !== "string") {
    throw new Error("Traffic service returned an invalid response.");
  }
  return {
    ok: true,
    incident_id: value.incident_id,
    level: value.level,
    level_reason: value.level_reason,
    ...(typeof value.distinct_reporters === "number" ? { distinct_reporters: value.distinct_reporters } : {}),
  };
}

export function parseRouteResponse(value: unknown): RouteResponse {
  const error = parseErrorPayload(value);
  if (error) return { ...error, routes: [] };
  if (!isRecord(value) || value.ok !== true || !Array.isArray(value.routes)) {
    throw new Error("Route service returned an invalid response.");
  }
  for (const route of value.routes) {
    if (!isRecord(route) || typeof route.id !== "string" || typeof route.name !== "string" ||
        typeof route.distance_m !== "number" || !Number.isFinite(route.distance_m) ||
        typeof route.duration_s !== "number" || !Number.isFinite(route.duration_s) ||
        typeof route.is_recommended !== "boolean" || typeof route.avoids_incident !== "boolean" ||
        route.provenance !== "estimated" || !isRecord(route.geometry) ||
        route.geometry.type !== "LineString" || !Array.isArray(route.geometry.coordinates) ||
        !Array.isArray(route.incidents_on_route)) {
      throw new Error("Route service returned an invalid response.");
    }
  }
  return { ok: true, routes: value.routes as RouteOption[] };
}

export const apiConfigurationError = apiBaseUrl
  ? null
  : "Traffic data is not configured for this mobile build.";

function throwApiError(response: Response, message: string): never {
  throw new MobileApiError(message, response.status);
}

export async function fetchActiveIncidents(signal?: AbortSignal) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");

  const { response, payload: rawPayload } = await requestJson<unknown>(
    `${apiBaseUrl}/api/incidents`,
    {},
    "Traffic service returned an invalid response.",
    signal,
  );
  const payload = parseActiveIncidentsResponse(rawPayload);

  if (!response.ok || !payload.ok) {
    throwApiError(response, payload.ok ? "Traffic service is unavailable." : payload.error);
  }

  return payload.incidents;
}

export async function submitIncident(
  input: {
    category: ReportCategory;
    lat: number;
    lng: number;
    gpsAccuracyM: number | null;
    gpsFixAt: string | null;
    note: string | null;
  },
  accessToken: string,
) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");

  const { response, payload: rawPayload } = await requestJson<unknown>(
    `${apiBaseUrl}/api/incidents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        category: input.category,
        lat: input.lat,
        lng: input.lng,
        gps_accuracy_m: input.gpsAccuracyM,
        gps_fix_at: input.gpsFixAt,
        note: input.note,
      }),
    },
    "Traffic service returned an invalid response.",
  );
  const payload = parseSubmitIncidentResponse(rawPayload);
  if (!response.ok || !payload.ok) {
    throwApiError(response, payload.ok ? "Incident submission is unavailable." : payload.error);
  }
  return payload;
}

export async function fetchRoute(start: RouteCoordinate, destination: RouteCoordinate) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");
  if (![...start, ...destination].every((value) => Number.isFinite(value))) {
    throw new Error("Enter valid start and destination coordinates.");
  }

  const { response, payload: rawPayload } = await requestJson<unknown>(
    `${apiBaseUrl}/api/route`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, destination }),
    },
    "Route service returned an invalid response.",
  );
  const payload = parseRouteResponse(rawPayload);
  if (!response.ok || !payload.ok) {
    throwApiError(response, payload.ok ? "Route service is unavailable." : payload.error);
  }
  return payload.routes;
}
