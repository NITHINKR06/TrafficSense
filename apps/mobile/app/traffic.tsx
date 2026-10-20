import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident } from "@trafficsense/shared";
import { apiConfigurationError, fetchActiveIncidents } from "../src/lib/api";

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
    L5: "Authority-reviewed disruption",
    L6: "High-confidence verified disruption",
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
      <Stack.Screen options={{ headerShown: true, title: "Traffic" }} />
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadIncidents(true)} />}>
        <Text style={styles.title}>Traffic overview</Text>
        <Text style={styles.body}>Active community reports from the TrafficSense service.</Text>
        {loading ? <ActivityIndicator color="#087f7b" style={styles.status} /> : null}
        {error ? (
          <View style={styles.state}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void loadIncidents()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : null}
        {!loading && !error && incidents.length === 0 ? <Text style={styles.state}>No active reports right now.</Text> : null}
        {incidents.map((incident) => (
          <View key={incident.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{categoryLabel(incident.category)}</Text>
              <Text style={styles.level}>{evidenceLabel(incident.level)}</Text>
            </View>
            <Text style={styles.meta}>{incident.report_count} report{incident.report_count === 1 ? "" : "s"} · {incident.provenance}</Text>
            <Text style={styles.reason}>{incident.level_reason}</Text>
            <Text style={styles.time}>Last confirmed {formatTime(incident.last_confirmed_at)}</Text>
          </View>
        ))}
        <Text style={styles.disclaimer}>Evidence levels describe the available reports. They do not prove the cause or guarantee a delay.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: 14, padding: 24, backgroundColor: "#f4f1ff" },
  title: { color: "#17142b", fontSize: 30, fontWeight: "800" },
  body: { marginTop: 14, color: "#514d65", fontSize: 17, lineHeight: 26 },
  status: { marginTop: 20 },
  state: { marginTop: 18, color: "#514d65", fontSize: 16, lineHeight: 24 },
  error: { color: "#a32d2d", fontSize: 15, lineHeight: 22 },
  retry: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: "#087f7b" },
  retryText: { color: "#ffffff", fontWeight: "700" },
  card: { marginTop: 8, padding: 18, borderRadius: 14, backgroundColor: "#ffffff" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  category: { flex: 1, color: "#17142b", fontSize: 18, fontWeight: "700", textTransform: "capitalize" },
  level: { color: "#5c4bb7", fontSize: 14, fontWeight: "800" },
  meta: { marginTop: 8, color: "#087f7b", fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  reason: { marginTop: 10, color: "#514d65", fontSize: 15, lineHeight: 22 },
  time: { marginTop: 10, color: "#6c687c", fontSize: 13 },
  disclaimer: { marginTop: 20, color: "#6c687c", fontSize: 13, lineHeight: 19 },
});