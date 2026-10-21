import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident, TrafficSegment } from "@trafficsense/shared";
import { apiConfigurationError, fetchActiveIncidents, fetchTrafficSegments } from "../src/lib/api";
import { categoryLabel } from "../src/lib/format";
import { describeFreshness } from "../src/lib/freshness";
import { evidenceLabel, formatClock, LIVE_REFRESH_MS } from "../src/lib/evidence";
import { TrafficMap } from "../src/components/traffic-map";
import { colors, minTouchTarget, radius, space } from "../src/theme/tokens";

type TrafficData = {
  incidents: LiveIncident[];
  segments: TrafficSegment[];
  readAt: string;
  updatedAt: Date;
};

type ViewMode = "map" | "list";

export default function TrafficScreen() {
  const [view, setView] = useState<ViewMode>("map");
  const [data, setData] = useState<TrafficData | null>(null);
  const [error, setError] = useState<string | null>(apiConfigurationError);
  const [loading, setLoading] = useState(!apiConfigurationError);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const hasData = useRef(false);

  // Keep the last good data on screen when a refresh fails, and say so, rather than blanking the view.
  const load = useCallback(async () => {
    if (apiConfigurationError) return;
    try {
      const [incidents, segments] = await Promise.all([fetchActiveIncidents(), fetchTrafficSegments()]);
      const updatedAt = new Date();
      setData({ incidents, segments: segments.segments, readAt: segments.read_at, updatedAt });
      setError(null);
      if (!hasData.current) {
        hasData.current = true;
        setFitKey((value) => value + 1);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Traffic service is unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh while the screen is visible, so live reports appear without a manual reload.
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), LIVE_REFRESH_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  const selected = useMemo(
    () => data?.incidents.find((incident) => incident.id === selectedId) ?? null,
    [data, selectedId],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Traffic" }} />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Live community reports</Text>
          <LiveStatus data={data} error={error} />
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {(["map", "list"] as const).map((item) => {
            const active = view === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setView(item)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item === "map" ? "Map" : "List"}</Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Text style={styles.error}>{error}</Text>
            {data ? <Text style={styles.stale}>Showing the last update from {formatClock(data.updatedAt)}.</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !data ? <ActivityIndicator color={colors.primary} style={styles.status} /> : null}

        {data && view === "map" ? (
          <View style={styles.mapArea}>
            <TrafficMap
              segments={data.segments}
              incidents={data.incidents}
              selectedIncidentId={selectedId}
              onSelectIncident={setSelectedId}
              fitKey={fitKey}
            />
            <ScrollView
              style={styles.details}
              contentContainerStyle={styles.detailsContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
            >
              {selected ? <IncidentCard incident={selected} /> : <Text style={styles.hint}>Tap a report on the map to see its details.</Text>}
              <SegmentSummary segments={data.segments} />
            </ScrollView>
          </View>
        ) : null}

        {data && view === "list" ? (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          >
            {data.incidents.length === 0 ? (
              <Text style={styles.state}>No active reports right now. This does not mean roads are clear; it only means none are on record.</Text>
            ) : null}
            {data.incidents.map((incident) => (
              <Pressable
                key={incident.id}
                accessibilityRole="button"
                onPress={() => {
                  setSelectedId(incident.id);
                  setView("map");
                }}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <IncidentCard incident={incident} />
              </Pressable>
            ))}
            <SegmentSummary segments={data.segments} />
          </ScrollView>
        ) : null}

      </View>
    </>
  );
}

function LiveStatus({ data, error }: { data: TrafficData | null; error: string | null }) {
  if (error && data) {
    return <Text style={styles.liveWarn}>Refresh failed · last update {formatClock(data.updatedAt)}</Text>;
  }
  if (data) {
    return (
      <Text style={styles.live} accessibilityLabel={`Live. Updated ${formatClock(data.updatedAt)}. Refreshes every 30 seconds.`}>
        ● Live · updated {formatClock(data.updatedAt)} · refreshes every 30 s
      </Text>
    );
  }
  return <Text style={styles.liveMuted}>Connecting…</Text>;
}

function IncidentCard({ incident }: { incident: LiveIncident }) {
  const freshness = describeFreshness(incident.last_confirmed_at);
  return (
    <View style={styles.card}>
      <Text style={styles.category}>{categoryLabel(incident.category)}</Text>
      <Text style={styles.level}>{evidenceLabel(incident.level)}</Text>
      <Text style={styles.meta}>
        {incident.report_count} report{incident.report_count === 1 ? "" : "s"} · {incident.provenance}
      </Text>
      <Text style={styles.reason}>{incident.level_reason}</Text>
      <Text style={freshness.stale ? styles.stale : styles.time}>{freshness.label}</Text>
    </View>
  );
}

function SegmentSummary({ segments }: { segments: TrafficSegment[] }) {
  if (segments.length === 0) return null;
  const slow = segments.filter((segment) => segment.severity === "slowdown").length;
  return (
    <View style={styles.segmentBox}>
      <Text style={styles.segmentTitle}>Corridor segments · SIMULATED</Text>
      <Text style={styles.segmentText}>
        {segments.length} schematic segments. {slow} show a simulated slowdown. Simulated slowdowns are demonstration data, not live speeds.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.md, gap: space.sm, backgroundColor: colors.background },
  header: { gap: 4 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  live: { color: colors.success, fontSize: 13, fontWeight: "700" },
  liveWarn: { color: colors.warning, fontSize: 13, fontWeight: "700" },
  liveMuted: { color: colors.textMuted, fontSize: 13 },
  tabs: { flexDirection: "row", borderRadius: radius.control, backgroundColor: colors.border, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: minTouchTarget, justifyContent: "center", borderRadius: 8 },
  tabActive: { backgroundColor: colors.surface },
  tabText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600", textAlign: "center" },
  tabTextActive: { color: colors.primary, fontWeight: "800" },
  status: { marginTop: space.md },
  errorBox: { padding: space.md, borderRadius: radius.control, backgroundColor: colors.errorSurface, gap: 4 },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  inlineAction: { alignSelf: "flex-start", minHeight: minTouchTarget, justifyContent: "center" },
  inlineActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  mapArea: { flex: 1, gap: space.sm },
  details: { flex: 1 },
  detailsContent: { gap: space.sm, paddingBottom: space.lg },
  hint: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  listContent: { gap: space.sm, paddingBottom: space.lg },
  state: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  card: { padding: space.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 },
  category: { color: colors.text, fontSize: 17, fontWeight: "700", textTransform: "capitalize" },
  level: { color: colors.evidence, fontSize: 14, fontWeight: "700" },
  meta: { color: colors.primary, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  reason: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  time: { color: colors.textMuted, fontSize: 13 },
  stale: { color: colors.warning, fontSize: 13, fontWeight: "700" },
  segmentBox: { padding: space.md, borderRadius: radius.card, backgroundColor: colors.evidenceSurface, gap: 4 },
  segmentTitle: { color: colors.evidence, fontSize: 13, fontWeight: "800" },
  segmentText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.85 },
});
