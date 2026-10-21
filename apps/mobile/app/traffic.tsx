import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident } from "@trafficsense/shared";
import { apiConfigurationError, fetchActiveIncidents } from "../src/lib/api";
import { categoryLabel } from "../src/lib/format";
import { describeFreshness } from "../src/lib/freshness";
import { colors, minTouchTarget, radius, space } from "../src/theme/tokens";

const EVIDENCE_LABELS: Record<LiveIncident["level"], string> = {
  L1: "Reported, not yet corroborated",
  L2: "Location-supported report",
  L3: "Multiple independent reports",
  L4: "Traffic slowdown corroborates disruption",
  L5: "Authority-reviewed disruption",
  L6: "High-confidence verified disruption",
};

export default function TrafficScreen() {
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [error, setError] = useState<string | null>(apiConfigurationError);
  const [loading, setLoading] = useState(!apiConfigurationError);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = useCallback(async (isRefresh = false) => {
    if (apiConfigurationError) return;
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

  // Reload whenever the screen becomes active, so a report submitted moments ago appears.
  useFocusEffect(
    useCallback(() => {
      void loadIncidents();
    }, [loadIncidents]),
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Traffic" }} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadIncidents(true)} />}
      >
        <Text style={styles.title}>Active community reports</Text>
        <Text style={styles.body}>Public reports from the TrafficSense service. Pull down to refresh.</Text>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.status} /> : null}

        {error ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Text style={styles.error}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadIncidents()} style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && incidents.length === 0 ? (
          <Text style={styles.state}>No active reports right now. This does not mean roads are clear; it only means none are on record.</Text>
        ) : null}

        {incidents.map((incident) => {
          const freshness = describeFreshness(incident.last_confirmed_at);
          return (
            <View key={incident.id} style={styles.card}>
              <Text style={styles.category}>{categoryLabel(incident.category)}</Text>
              <Text style={styles.level}>{EVIDENCE_LABELS[incident.level]}</Text>
              <Text style={styles.meta}>
                {incident.report_count} report{incident.report_count === 1 ? "" : "s"} · {incident.provenance}
              </Text>
              <Text style={styles.reason}>{incident.level_reason}</Text>
              <Text style={freshness.stale ? styles.stale : styles.time}>{freshness.label}</Text>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Evidence levels describe the available reports. They do not prove the cause or guarantee a delay.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: space.sm, padding: space.lg, paddingBottom: space.lg * 2, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  status: { marginTop: space.md },
  state: { marginTop: space.sm, color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  errorBox: { marginTop: space.sm, padding: space.md, borderRadius: radius.control, backgroundColor: colors.errorSurface, gap: space.xs },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  inlineAction: { alignSelf: "flex-start", minHeight: minTouchTarget, justifyContent: "center" },
  inlineActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  card: { padding: space.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  category: { color: colors.text, fontSize: 18, fontWeight: "700", textTransform: "capitalize" },
  level: { color: colors.evidence, fontSize: 14, fontWeight: "700" },
  meta: { color: colors.primary, fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  reason: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  time: { color: colors.textMuted, fontSize: 13 },
  stale: { color: colors.warning, fontSize: 13, fontWeight: "700" },
  disclaimer: { marginTop: space.sm, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
