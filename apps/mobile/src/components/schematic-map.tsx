import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LiveIncident, RouteOption, TrafficSegment } from "@trafficsense/shared";
import { colors, radius, space, typography } from "../theme/tokens";
import { projectSchematicPoint, type SchematicCoordinate } from "../lib/schematic-map";

type Props = {
  incidents: LiveIncident[];
  segments: TrafficSegment[];
  routes?: RouteOption[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  fullScreen?: boolean;
};

type Coordinate = SchematicCoordinate;

function validCoordinate(value: unknown): value is Coordinate {
  return Array.isArray(value) && value.length === 2 && value.every((part) => typeof part === "number" && Number.isFinite(part));
}

function collectCoordinates(segments: TrafficSegment[], routes: RouteOption[] | undefined, incidents: LiveIncident[]): Coordinate[] {
  return [
    ...segments.flatMap((segment) => segment.geometry.coordinates.filter(validCoordinate)),
    ...(routes ?? []).flatMap((route) => route.geometry.coordinates.filter(validCoordinate)),
    ...incidents.map((incident) => [incident.lng, incident.lat] as Coordinate).filter(validCoordinate),
  ];
}

export function SchematicMap({ incidents, segments, routes, selectedIncidentId, onSelectIncident, fullScreen = false }: Props) {
  const points = collectCoordinates(segments, routes, incidents);
  const label = incidents.length === 0 ? "No active community reports" : `${incidents.length} active community report${incidents.length === 1 ? "" : "s"}`;

  return (
    <View style={[styles.frame, fullScreen && styles.fullScreenFrame]} accessibilityLabel={`Schematic traffic map. ${label}`}>
      <View pointerEvents="none" style={styles.grid}>
        {[20, 40, 60, 80].map((position) => <View key={`v-${position}`} style={[styles.vertical, { left: `${position}%` }]} />)}
        {[20, 40, 60, 80].map((position) => <View key={`h-${position}`} style={[styles.horizontal, { top: `${position}%` }]} />)}
      </View>
      <View style={styles.routeHint} pointerEvents="none">
        <Text style={styles.routeHintText}>{routes?.length ? "Route selection is available; street geometry needs the detailed map" : "Community reports and corridor shown schematically"}</Text>
      </View>
      {incidents.map((incident) => {
        const point = projectSchematicPoint([incident.lng, incident.lat], points);
        const selected = incident.id === selectedIncidentId;
        return (
          <Pressable
            key={incident.id}
            accessibilityRole="button"
            accessibilityLabel={`${incident.category}, ${incident.level}. ${incident.level_reason}`}
            onPress={() => onSelectIncident(incident.id)}
            style={[styles.incident, selected && styles.incidentSelected, { left: point.left as unknown as number, top: point.top as unknown as number }]}
          >
            <View style={styles.incidentCore} />
          </Pressable>
        );
      })}
      <View style={styles.footer} pointerEvents="none">
        <Text style={styles.footerText}>SCHEMATIC · not street navigation</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 250, overflow: "hidden", borderRadius: radius.card, backgroundColor: "#edf3ee", borderWidth: 1, borderColor: colors.border },
  fullScreenFrame: { flex: 1, height: undefined, borderRadius: 0 },
  grid: { ...StyleSheet.absoluteFill },
  vertical: { position: "absolute", top: 0, bottom: 0, borderLeftWidth: 1, borderColor: "#d7e2d8" },
  horizontal: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderColor: "#d7e2d8" },
  routeHint: { position: "absolute", top: space.sm, left: space.sm, right: space.sm, padding: space.sm, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.9)" },
  routeHintText: { ...typography.bodySm, color: colors.textSecondary, textAlign: "center" },
  incident: { position: "absolute", width: 36, height: 36, marginLeft: -18, marginTop: -18, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(186,26,26,0.2)" },
  incidentSelected: { backgroundColor: "rgba(186,26,26,0.38)", transform: [{ scale: 1.15 }] },
  incidentCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.error, borderWidth: 2, borderColor: colors.surface },
  footer: { position: "absolute", left: space.sm, bottom: space.sm, paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.92)" },
  footerText: { ...typography.codeSm, color: colors.primary, fontSize: 10 },
});
