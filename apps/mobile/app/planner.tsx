import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { RouteCoordinate, RouteOption } from "@trafficsense/shared";
import { fetchRoute } from "../src/lib/api";
import { colors, sharedStyles } from "../src/ui/theme";

const DEFAULT_START = "74.8426, 12.8698";
const DEFAULT_DESTINATION = "74.8554, 12.9141";

function parseCoordinate(value: string): RouteCoordinate | null {
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return null;
  return [parts[0], parts[1]];
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export default function PlannerScreen() {
  const [startText, setStartText] = useState(DEFAULT_START);
  const [destinationText, setDestinationText] = useState(DEFAULT_DESTINATION);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hasChosenAvoidance, setHasChosenAvoidance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null,
    [routes, selectedRouteId],
  );
  const warnings = selectedRoute?.incidents_on_route ?? [];
  const alternative = routes.find((route) => route.id !== selectedRoute?.id && route.avoids_incident) ?? null;

  async function submit() {
    setError(null);
    const start = parseCoordinate(startText);
    const destination = parseCoordinate(destinationText);
    if (!start || !destination) {
      setError("Enter origin and destination as longitude, latitude coordinates.");
      return;
    }
    setLoading(true);
    setHasChosenAvoidance(false);
    try {
      const nextRoutes = await fetchRoute(start, destination);
      if (nextRoutes.length === 0) {
        setRoutes([]);
        setSelectedRouteId(null);
        setError("No route is available for those points.");
        return;
      }
      setRoutes(nextRoutes);
      setSelectedRouteId(nextRoutes[0].id);
    } catch (reason) {
      setRoutes([]);
      setSelectedRouteId(null);
      setError(reason instanceof Error ? reason.message : "Route planning is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function chooseAlternative() {
    if (!alternative) return;
    setHasChosenAvoidance(true);
    setSelectedRouteId(alternative.id);
  }

  return (
    <ScrollView contentContainerStyle={sharedStyles.screen} keyboardShouldPersistTaps="handled">
      <Text style={sharedStyles.title}>Plan your route</Text>
      <Text style={sharedStyles.body}>Enter a Mangaluru origin and destination as longitude, latitude. Route durations are free-flow estimates, not live travel times.</Text>
      <View style={styles.infoCard}>
        <Text style={sharedStyles.simulatedLabel}>FREE-FLOW ESTIMATE</Text>
        <Text style={styles.infoText}>TrafficSense checks active reports against the route. It can suggest an alternative, but it cannot guarantee safety or time savings.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Origin (longitude, latitude)</Text>
        <TextInput accessibilityLabel="Origin longitude and latitude" autoCapitalize="none" keyboardType="numbers-and-punctuation" onChangeText={setStartText} placeholder="74.8426, 12.8698" placeholderTextColor={colors.secondaryText} style={sharedStyles.input} value={startText} />
        <Text style={styles.label}>Destination (longitude, latitude)</Text>
        <TextInput accessibilityLabel="Destination longitude and latitude" autoCapitalize="none" keyboardType="numbers-and-punctuation" onChangeText={setDestinationText} placeholder="74.8554, 12.9141" placeholderTextColor={colors.secondaryText} style={sharedStyles.input} value={destinationText} />
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => void submit()} style={({ pressed }) => [sharedStyles.primaryButton, (pressed || loading) && styles.pressed]}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={sharedStyles.primaryButtonText}>Find route</Text>}
        </Pressable>
      </View>
      {error ? <Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text> : null}
      {selectedRoute ? <View style={styles.result}>
        <Text style={styles.resultTitle}>Route result</Text>
        <RouteCard route={selectedRoute} selected />
        {warnings.length > 0 && !hasChosenAvoidance ? <View style={styles.warning}>
          <Text style={styles.warningTitle}>Reported incident on this route</Text>
          {warnings.map((warning) => <Pressable key={warning.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/traffic/[incidentId]", params: { incidentId: warning.id } })}><Text style={styles.warningText}>{warning.label} · {warning.level}. Open details.</Text></Pressable>)}
          {alternative ? <Pressable accessibilityRole="button" onPress={chooseAlternative} style={sharedStyles.primaryButton}><Text style={sharedStyles.primaryButtonText}>Avoid this route</Text></Pressable> : <Text style={styles.warningText}>No clear alternative is available from the current route results.</Text>}
        </View> : null}
        {hasChosenAvoidance && alternative ? <View style={styles.choice}><Text style={styles.choiceTitle}>You chose this alternative</Text><Text style={styles.choiceText}>It avoids the reported incident in the route response. Its time remains a free-flow estimate.</Text></View> : null}
        {warnings.length === 0 ? <Text style={styles.clear}>No active route warning was returned for this route. This does not prove the road is clear.</Text> : null}
      </View> : null}
    </ScrollView>
  );
}

function RouteCard({ route, selected }: { route: RouteOption; selected: boolean }) {
  return <View style={[styles.routeCard, selected && styles.routeCardSelected]}>
    <Text style={styles.routeName}>{route.name}</Text>
    <Text style={styles.routeMeta}>{formatDistance(route.distance_m)} · {formatDuration(route.duration_s)} · estimated</Text>
    <Text style={styles.routeNote}>{route.avoids_incident ? "Avoids a reported incident in this route response." : "Selected route."}</Text>
  </View>;
}

const styles = StyleSheet.create({
  infoCard: { ...sharedStyles.card, gap: 10, backgroundColor: colors.violetSurface },
  infoText: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  form: { gap: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  pressed: { backgroundColor: colors.primaryPressed, opacity: 0.9 },
  result: { gap: 12 },
  resultTitle: { color: colors.text, fontSize: 21, fontWeight: "800" },
  routeCard: { ...sharedStyles.card, gap: 5 },
  routeCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  routeName: { color: colors.text, fontSize: 17, fontWeight: "700" },
  routeMeta: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  routeNote: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  warning: { gap: 12, padding: 16, borderRadius: 14, backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: "#fed7aa" },
  warningTitle: { color: colors.warning, fontSize: 17, fontWeight: "800" },
  warningText: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  choice: { gap: 6, padding: 16, borderRadius: 14, backgroundColor: "#e8f7ee", borderWidth: 1, borderColor: "#b7e3c6" },
  choiceTitle: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  choiceText: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  clear: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
});
