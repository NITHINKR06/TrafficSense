export type TrafficEvidenceLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
export type IncidentStatus = "open" | "cleared" | "resolved" | "expired";
export type IncidentProvenance = "reported" | "verified" | "authority";

export type LiveIncident = {
  id: string;
  category: string;
  lat: number;
  lng: number;
  status: IncidentStatus;
  level: TrafficEvidenceLevel;
  level_reason: string;
  first_reported_at: string;
  last_confirmed_at: string;
  cleared_at?: string | null;
  clear_count?: number;
  confirm_count?: number;
  provenance: IncidentProvenance;
  report_count: number;
  has_photo?: boolean;
  photo_data_url?: string | null;
  photo_confidence?: string | null;
};

export type ActiveIncidentsResponse =
  | { ok: true; incidents: LiveIncident[] }
  | { ok: false; error: string };

export const reportCategories = [
  ["accident", "Accident"],
  ["road_repair", "Road repair / construction"],
  ["festival", "Festival / public event"],
  ["strike", "Strike / protest"],
  ["vip_movement", "VIP movement"],
  ["landslide", "Landslide"],
  ["heavy_rain", "Heavy rain"],
  ["flood", "Flood / waterlogging"],
  ["signal_failure", "Traffic signal failure"],
  ["breakdown", "Vehicle breakdown"],
  ["road_closed", "Road closure"],
  ["bridge_maintenance", "Bridge / road maintenance"],
  ["police_restriction", "Police / security restrictions"],
  ["fallen_tree", "Fallen tree / hazard"],
  ["heavy_traffic", "Heavy traffic / congestion"],
  ["other", "Other"],
  ["unknown", "Unknown"],
] as const;

export type ReportCategory = (typeof reportCategories)[number][0];
export type SubmitIncidentResponse =
  | { ok: true; incident_id: string; level: string; level_reason: string; distinct_reporters?: number }
  | { ok: false; error: string };

export type RouteCoordinate = [number, number];

export type RouteIncidentWarning = {
  id: string;
  category: string;
  level: string;
  label: string;
  distance_to_route_m: number;
};

export type RouteOption = {
  id: string;
  name: string;
  distance_m: number;
  duration_s: number;
  geometry: {
    type: "LineString";
    coordinates: RouteCoordinate[];
  };
  is_recommended: boolean;
  avoids_incident: boolean;
  avoided_incident_reason?: string;
  incidents_on_route: RouteIncidentWarning[];
  provenance: "estimated";
};

export type RouteResponse =
  | { ok: true; routes: RouteOption[] }
  | { ok: false; routes: RouteOption[]; error: string };

// Schematic corridor segments from GET /api/traffic. Provenance is always simulated.
export type TrafficSegmentSeverity = "slowdown" | "corroborated" | "reported" | "clear";

export type TrafficSegment = {
  id: string;
  name: string;
  direction: string;
  geometry: { type: "LineString"; coordinates: RouteCoordinate[] };
  severity: TrafficSegmentSeverity;
  provenance: "simulated";
};

export type TrafficSegmentsResponse =
  | { ok: true; read_at: string; segments: TrafficSegment[] }
  | { ok: false; error: string };

export type AuthorityNotificationItem = {
  id: string;
  incident_id: string;
  category: string;
  landmark: string;
  lat: number;
  lng: number;
  has_photo: boolean;
  photo_summary: string | null;
  level: TrafficEvidenceLevel;
  reporter_email: string | null;
  is_read: boolean;
  created_at: string;
};

export type AuthorityNotificationsResponse =
  | { ok: true; notifications: AuthorityNotificationItem[] }
  | { ok: false; error: string };

export const MANGALURU_LANDMARKS: readonly { name: string; lat: number; lng: number }[] = [
  { name: "Hampankatta (City Centre)", lat: 12.868, lng: 74.842 },
  { name: "Lalbagh Junction (MG Road)", lat: 12.877, lng: 74.846 },
  { name: "KSRTC Bus Stand (Bejai)", lat: 12.885, lng: 74.848 },
  { name: "Ladyhill Circle", lat: 12.894, lng: 74.841 },
  { name: "Bunts Hostel Circle", lat: 12.872, lng: 74.849 },
  { name: "Jyoti (Ambedkar) Circle", lat: 12.871, lng: 74.845 },
  { name: "Nanthoor Junction", lat: 12.874, lng: 74.865 },
  { name: "Pumpwell (Mahaveera) Circle", lat: 12.858, lng: 74.862 },
  { name: "Kottara Chowki", lat: 12.908, lng: 74.838 },
  { name: "Kadri Park / Circuit House", lat: 12.882, lng: 74.858 },
  { name: "Mangaluru Central Railway", lat: 12.864, lng: 74.839 },
  { name: "Mangalore International Airport", lat: 12.961, lng: 74.890 },
];

export function resolveNearestLandmark(lat: number, lng: number): string {
  let closest = MANGALURU_LANDMARKS[0];
  let minDistanceM = Number.POSITIVE_INFINITY;

  for (const landmark of MANGALURU_LANDMARKS) {
    const dLat = (lat - landmark.lat) * 111_000;
    const dLng = (lng - landmark.lng) * 108_200;
    const distanceM = Math.sqrt(dLat * dLat + dLng * dLng);
    if (distanceM < minDistanceM) {
      minDistanceM = distanceM;
      closest = landmark;
    }
  }

  if (minDistanceM < 300) {
    return `Near ${closest.name}`;
  }
  if (minDistanceM < 1500) {
    return `${closest.name} Corridor`;
  }
  const km = (minDistanceM / 1000).toFixed(1);
  return `${closest.name} area (~${km} km)`;
}

export function haversineDistanceM(coord1: RouteCoordinate, coord2: RouteCoordinate): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function minDistanceToRoute(point: RouteCoordinate, routeCoords: RouteCoordinate[]): number {
  if (routeCoords.length === 0) return Infinity;
  if (routeCoords.length === 1) return haversineDistanceM(point, routeCoords[0]);

  const R = 6371000;
  const rad = Math.PI / 180;
  const cosLat0 = Math.cos(point[1] * rad);
  const toXY = ([lng, lat]: RouteCoordinate): [number, number] => [
    (lng - point[0]) * rad * R * cosLat0,
    (lat - point[1]) * rad * R,
  ];

  let minDistance = Infinity;
  for (let i = 1; i < routeCoords.length; i++) {
    const [ax, ay] = toXY(routeCoords[i - 1]);
    const [bx, by] = toXY(routeCoords[i]);
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq));
    const dist = Math.hypot(ax + t * dx, ay + t * dy);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance;
}

export type ConfidenceTierLabel = "Unverified" | "Likely" | "Confirmed" | "Authority Confirmed";

export type ConfidenceScoreBreakdown = {
  score: number; // 0..1
  tierLabel: ConfidenceTierLabel;
  explanation: string;
  factors: {
    reportWeight: number;
    gpsBonus: number;
    photoBonus: number;
    authorityBonus: number;
    clearPenalty: number;
    ageDecay: number;
  };
};

/**
 * Computes a continuous, explainable confidence score (0..1) from an incident's
 * verification signals, commuter feedback, and age decay while keeping L1..L6 labels.
 */
export function computeIncidentConfidence(
  incident: Pick<
    LiveIncident,
    "level" | "report_count" | "confirm_count" | "clear_count" | "has_photo" | "photo_data_url" | "first_reported_at" | "last_confirmed_at"
  >,
  nowMs: number = Date.now()
): ConfidenceScoreBreakdown {
  const reports = Math.max(1, incident.report_count || 1);
  const confirms = Math.max(0, incident.confirm_count ?? 0);
  const clears = Math.max(0, incident.clear_count ?? 0);
  const hasPhoto = Boolean(incident.has_photo || incident.photo_data_url);

  const reportWeight = Math.min(2.4, 0.55 + (reports - 1) * 0.65 + confirms * 0.25);
  const gpsBonus = incident.level === "L2" || incident.level === "L3" || incident.level === "L5" || incident.level === "L6" ? 0.35 : 0;
  const photoBonus = hasPhoto || incident.level === "L5" ? 1.1 : 0;
  const authorityBonus = incident.level === "L6" ? 3.0 : 0;
  const clearPenalty = clears * 0.85;

  const lastMs = Date.parse(incident.last_confirmed_at || incident.first_reported_at);
  const ageMin = Number.isFinite(lastMs) ? Math.max(0, (nowMs - lastMs) / 60_000) : 0;
  const ageDecay = Math.exp(-ageMin / 120); // ~2-hour half-life

  const logOdds = (reportWeight + gpsBonus + photoBonus + authorityBonus - clearPenalty) * ageDecay - 0.5;
  const score = Number((1 / (1 + Math.exp(-logOdds))).toFixed(2));

  let tierLabel: ConfidenceTierLabel = "Unverified";
  if (incident.level === "L6") tierLabel = "Authority Confirmed";
  else if (score >= 0.72 || incident.level === "L3" || incident.level === "L5") tierLabel = "Confirmed";
  else if (score >= 0.48 || incident.level === "L2") tierLabel = "Likely";

  const parts: string[] = [`${reports} report${reports === 1 ? "" : "s"}`];
  if (hasPhoto || incident.level === "L5") parts.push("L5 photo");
  if (incident.level === "L6") parts.push("authority confirmed");
  if (clears > 0) parts.push(`${clears} clear vote${clears === 1 ? "" : "s"}`);

  return {
    score,
    tierLabel,
    explanation: parts.join(" · "),
    factors: {
      reportWeight: Number(reportWeight.toFixed(2)),
      gpsBonus,
      photoBonus,
      authorityBonus,
      clearPenalty: Number(clearPenalty.toFixed(2)),
      ageDecay: Number(ageDecay.toFixed(2)),
    },
  };
}
