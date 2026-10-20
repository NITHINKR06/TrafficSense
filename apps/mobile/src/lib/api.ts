import type { ActiveIncidentsResponse } from "@trafficsense/shared";

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
