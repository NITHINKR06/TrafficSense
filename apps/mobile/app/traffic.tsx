import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident } from "@trafficsense/shared";
import { apiConfigurationError, fetchActiveIncidents } from "../src/lib/api";
import { colors, sharedStyles } from "../src/ui/theme";

function categoryLabel(category: string) {
  return category.replaceAll("_", " ");
}

function formatTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString() : "Unknown time";
}

function evidenceLabel(level: LiveIncident["level"]) {
  return {
    L1: "Reported, not yet corroborated",
    L2: "Location-supported report",
    L3: "Multiple independent reports",
    L4: "Traffic slowdown corroborates disruption",
    L5: "Additional evidence is not collected in this demo",
    L6: "Authority action recorded in the app",
  }[level];
}

export default function TrafficScreen() {
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [error, setError] = useState<string | null>(apiConfigurationError);
  const [loading, setLoading] = useState(!apiConfigurationError);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setIncidents(await fetchActiveIncidents());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Traffic service is unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!apiConfigurationError) void loadIncidents();
    }, [loadIncidents]),
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadIncidents(true)} />}>
        <Text style={styles.title}>Traffic overview</Text>
        <Text style={styles.body}>Active community reports from the TrafficSense service. Pull down to refresh.</Text>
        <Text style={sharedStyles.simulatedLabel}>COMMUNITY REPORTS · EVIDENCE LABELLED</Text>
        {loading ? <ActivityIndicator accessibilityLabel="Loading active traffic reports" color={colors.primary} style={styles.status} /> : null}
        {error ? (
          <View style={styles.state}>
            <Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadIncidents()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : null}
        {!loading && !error && incidents.length === 0 ? <Text style={styles.state}>No active reports right now.</Text> : null}
        {incidents.map((incident) => (
          <Pressable key={incident.id} accessibilityRole="button" accessibilityLabel={`Open details for ${categoryLabel(incident.category)}`} onPress={() => router.push({ pathname: "/traffic/[incidentId]", params: { incidentId: incident.id } })} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{categoryLabel(incident.category)}</Text>
              <Text style={styles.level}>{evidenceLabel(incident.level)}</Text>
            </View>
            <Text style={styles.meta}>{incident.report_count} report{incident.report_count === 1 ? "" : "s"} · {incident.provenance}</Text>
            <Text style={styles.reason}>{incident.level_reason}</Text>
            <Text style={styles.time}>Last confirmed {formatTime(incident.last_confirmed_at)}</Text>
            <Text style={styles.openDetails}>Open incident details</Text>
          </Pressable>
        ))}
        <Text style={styles.disclaimer}>Evidence levels describe the available reports. They do not prove the cause or guarantee a delay.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: sharedStyles.screen,
  title: sharedStyles.title,
  body: sharedStyles.body,
  status: { marginTop: 20 },
  state: { marginTop: 8, color: colors.secondaryText, fontSize: 16, lineHeight: 24 },
  retry: { ...sharedStyles.primaryButton, alignSelf: "flex-start", marginTop: 12 },
  retryText: { color: "#ffffff", fontWeight: "700" },
  card: { ...sharedStyles.card, gap: 0 },
  cardPressed: { backgroundColor: "#f3f7f7", borderColor: colors.primary },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  category: { flex: 1, color: colors.text, fontSize: 18, fontWeight: "700", textTransform: "capitalize" },
  level: { color: colors.violet, fontSize: 14, fontWeight: "800" },
  meta: { marginTop: 8, color: colors.primary, fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  reason: { marginTop: 10, color: colors.secondaryText, fontSize: 15, lineHeight: 22 },
  time: { marginTop: 10, color: colors.secondaryText, fontSize: 13 },
  openDetails: { marginTop: 14, color: colors.primary, fontSize: 14, fontWeight: "700" },
  disclaimer: { marginTop: 8, color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
});
