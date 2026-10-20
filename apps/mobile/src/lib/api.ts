import type {
  ActiveIncidentsResponse,
  ReportCategory,
  SubmitIncidentResponse,
} from "@trafficsense/shared";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export const apiConfigurationError = apiBaseUrl
  ? null
  : "Traffic data is not configured for this mobile build.";

export async function fetchActiveIncidents(signal?: AbortSignal) {
  if (!apiBaseUrl) throw new Error("Traffic data is not configured for this mobile build.");

  const response = await fetch(`${apiBaseUrl}/api/incidents`, { signal });
  let payload: ActiveIncidentsResponse;
  try {
    payload = (await response.json()) as ActiveIncidentsResponse;
  } catch {
    throw new Error("Traffic service returned an invalid response.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Traffic service is unavailable." : payload.error);
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

  const response = await fetch(`${apiBaseUrl}/api/incidents`, {
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
  });

  let payload: SubmitIncidentResponse;
  try {
    payload = (await response.json()) as SubmitIncidentResponse;
  } catch {
    throw new Error("Traffic service returned an invalid response.");
  }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Incident submission is unavailable." : payload.error);
  }
  return payload;
}
