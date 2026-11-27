import type { ReportCategory, RouteCoordinate } from "@trafficsense/shared";
import { MobileApiError, requestJson } from "./request";
import {
  parseActiveIncidentsResponse,
  parseRouteResponse,
  parseSubmitIncidentResponse,
  parseTrafficSegmentsResponse,
} from "./response-parsers";

export {
  parseActiveIncidentsResponse,
  parseRouteResponse,
  parseSubmitIncidentResponse,
  parseTrafficSegmentsResponse,
} from "./response-parsers";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

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
    { signal, retryGet: true },
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
    l5Verified?: boolean;
    l5Summary?: string | null;
    l5PhotoDataUrl?: string | null;
    l5ConfidenceTier?: "high" | "moderate" | "low" | null;
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
        ...(input.l5Verified !== undefined ? { l5_verified: input.l5Verified } : {}),
        ...(input.l5Summary !== undefined ? { l5_summary: input.l5Summary } : {}),
        ...(input.l5PhotoDataUrl !== undefined ? { l5_photo_data_url: input.l5PhotoDataUrl } : {}),
        ...(input.l5ConfidenceTier !== undefined ? { l5_confidence_tier: input.l5ConfidenceTier } : {}),
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

export async function fetchDetourRoute(input: {
  currentLocation: RouteCoordinate;
  destination: RouteCoordinate;
  blockedIncidentId?: string;
  blockedIncident?: RouteCoordinate;
  exclusionRadiusM?: number;
}) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");

  const { response, payload: rawPayload } = await requestJson<unknown>(
    `${apiBaseUrl}/api/route/reroute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Detour service returned an invalid response.",
  );
  const normalized =
    rawPayload &&
    typeof rawPayload === "object" &&
    "detourRoute" in rawPayload &&
    !("routes" in rawPayload)
      ? {
          ok: (rawPayload as { ok?: boolean }).ok,
          routes: [(rawPayload as { detourRoute: unknown }).detourRoute],
        }
      : rawPayload;
  const payload = parseRouteResponse(normalized);
  if (!response.ok || !payload.ok) {
    throwApiError(response, payload.ok ? "Detour service is unavailable." : payload.error);
  }
  return payload.routes;
}

export async function submitIncidentFeedback(
  incidentId: string,
  vote: "confirm" | "clear",
  accessToken: string,
) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");

  const { response, payload: rawPayload } = await requestJson<unknown>(
    `${apiBaseUrl}/api/incidents/${encodeURIComponent(incidentId)}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ vote }),
    },
    "Feedback service returned an invalid response.",
  );
  const res = rawPayload as {
    ok?: boolean;
    error?: string;
    incident_id?: string;
    status?: string;
    clear_count?: number;
    confirm_count?: number;
    cleared_at?: string | null;
  };
  if (!response.ok || !res?.ok) {
    throwApiError(response, res?.error ?? "Unable to record incident feedback.");
  }
  return res;
}

export async function fetchTrafficSegments(signal?: AbortSignal) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");

  const { response, payload: rawPayload } = await requestJson<unknown>(
    `${apiBaseUrl}/api/traffic`,
    {},
    "Traffic service returned an invalid response.",
    { signal, retryGet: true },
  );
  const payload = parseTrafficSegmentsResponse(rawPayload);
  if (!response.ok || !payload.ok) {
    throwApiError(response, payload.ok ? "Traffic service is unavailable." : payload.error);
  }
  return payload;
}
