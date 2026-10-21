import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident, TrafficSegment } from "@trafficsense/shared";
import { apiConfigurationError, fetchActiveIncidents, fetchTrafficSegments } from "../src/lib/api";
import { categoryLabel } from "../src/lib/format";
import { describeFreshness } from "../src/lib/freshness";
import { evidenceLabel, formatClock, LIVE_REFRESH_MS } from "../src/lib/evidence";
import { TrafficMap } from "../src/components/traffic-map";
import { Card, EvidenceBadge, FeedbackBox, FreshnessChip, SimulatedBadge } from "../src/components/ui";
import { colors, minTouchTarget, radius, space, typography } from "../src/theme/tokens";

type TrafficData = {
  incidents: LiveIncident[];
  segments: TrafficSegment[];
  readAt: string;
  updatedAt: Date;
};

type ViewMode = "map" | "list";

const CATEGORY_ICONS: Record<string, string> = {
  accident: "🚗",
  flood: "🌊",
  road_closed: "⛔",
  heavy_traffic: "🚦",
  road_repair: "🚧",
  breakdown: "🔧",
  fallen_tree: "🌲",
  landslide: "🪨",
  signal_failure: "⚠️",
  heavy_rain: "🌧️",
  bridge_maintenance: "🌉",
  police_restriction: "👮",
  vip_movement: "🚔",
  strike: "📢",
  festival: "🎪",
  other: "❓",
  unknown: "ℹ️",
};

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
      <Stack.Screen options={{ headerShown: true, title: "Live Traffic Map" }} />
      <View style={styles.screen}>
        {/* Header & Status Indicator */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Live community reports</Text>
            <LiveStatus data={data} error={error} />
          </View>

          {/* Mode Switch Tabs: Map / List */}
          <View style={styles.tabs} accessibilityRole="tablist">
            {(["map", "list"] as const).map((item) => {
              const active = view === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Switch to ${item} view`}
                  onPress={() => setView(item)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {item === "map" ? "🗺️ Map view" : "📋 List view"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Error / Last-Good-Data Warning */}
        {error ? (
          <FeedbackBox
            variant="warning"
            title="Update interrupted"
            message={
              data
                ? `Showing last recorded update from ${formatClock(data.updatedAt)}. ${error}`
                : error
            }
            actionText="Try again"
            onAction={() => void load()}
          />
        ) : null}

        {loading && !data ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading live reports and corridor feeds…</Text>
          </View>
        ) : null}

        {/* Map View */}
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    void load();
                  }}
                  colors={[colors.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {selected ? (
                <IncidentDetailCard
                  incident={selected}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <View style={styles.hintBox}>
                  <Text style={styles.hintIcon}>👆</Text>
                  <Text style={styles.hint}>
                    Tap any incident pin on the map to inspect evidence tiers, verification source, and road context.
                  </Text>
                </View>
              )}
              <SegmentSummary segments={data.segments} />
            </ScrollView>
          </View>
        ) : null}

        {/* List View */}
        {data && view === "list" ? (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load();
                }}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {data.incidents.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🕊️</Text>
                <Text style={styles.emptyTitle}>No active reports on record</Text>
                <Text style={styles.emptyText}>
                  This means no community reports are currently logged for this corridor. It does not guarantee clear free-flow conditions everywhere.
                </Text>
              </Card>
            ) : null}

            {data.incidents.map((incident) => (
              <Pressable
                key={incident.id}
                accessibilityRole="button"
                accessibilityLabel={`View report: ${categoryLabel(incident.category)}`}
                onPress={() => {
                  setSelectedId(incident.id);
                  setView("map");
                }}
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
    return (
      <View style={styles.liveStatusRow}>
        <View style={[styles.statusDot, styles.dotWarn]} />
        <Text style={styles.liveWarn}>Offline · Last {formatClock(data.updatedAt)}</Text>
      </View>
    );
  }
  if (data) {
    return (
      <View
        style={styles.liveStatusRow}
        accessibilityLabel={`Live. Updated ${formatClock(data.updatedAt)}. Refreshes every 30 seconds.`}
      >
        <View style={[styles.statusDot, styles.dotLive]} />
        <Text style={styles.liveText}>Live · {formatClock(data.updatedAt)} · 30s sync</Text>
      </View>
    );
  }
  return (
    <View style={styles.liveStatusRow}>
      <View style={[styles.statusDot, styles.dotMuted]} />
      <Text style={styles.liveMuted}>Connecting…</Text>
    </View>
  );
}

function IncidentCard({ incident }: { incident: LiveIncident }) {
  const freshness = describeFreshness(incident.last_confirmed_at);
  const icon = CATEGORY_ICONS[incident.category] ?? "⚠️";

  return (
    <Card style={styles.incidentCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.categoryBadgeRow}>
          <Text style={styles.cardCategoryIcon}>{icon}</Text>
          <Text style={styles.categoryTitle}>{categoryLabel(incident.category)}</Text>
        </View>
        <FreshnessChip label={freshness.label} stale={freshness.stale} />
      </View>

      <View style={styles.cardBadges}>
        <EvidenceBadge level={incident.level} label={evidenceLabel(incident.level)} />
        <View style={styles.provenancePill}>
          <Text style={styles.provenanceText}>
            {incident.report_count} {incident.report_count === 1 ? "report" : "reports"} · {incident.provenance}
          </Text>
        </View>
      </View>

      <Text style={styles.reasonText}>{incident.level_reason}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.localityText}>
          {incident.lat.toFixed(4)}° N, {incident.lng.toFixed(4)}° E
        </Text>
        <Text style={styles.viewOnMapText}>View on map →</Text>
      </View>
    </Card>
  );
}

function IncidentDetailCard({
  incident,
  onClose,
}: {
  incident: LiveIncident;
  onClose: () => void;
}) {
  const freshness = describeFreshness(incident.last_confirmed_at);
  const icon = CATEGORY_ICONS[incident.category] ?? "⚠️";

  return (
    <Card style={styles.selectedDetailCard} elevated>
      <View style={styles.detailHeaderRow}>
        <View style={styles.detailTitleGroup}>
          <View style={styles.detailIconCircle}>
            <Text style={styles.detailCategoryIcon}>{icon}</Text>
          </View>
          <View style={styles.detailTitleCol}>
            <Text style={styles.detailEyebrow}>SELECTED ROAD REPORT</Text>
            <Text style={styles.detailTitle}>{categoryLabel(incident.category)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close report details"
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.cardBadges}>
        <FreshnessChip label={freshness.label} stale={freshness.stale} />
        <EvidenceBadge level={incident.level} label={evidenceLabel(incident.level)} />
      </View>

      <Text style={styles.detailReason}>{incident.level_reason}</Text>

      <View style={styles.telemetryBox}>
        <Text style={styles.telemetryText}>
          Location: {incident.lat.toFixed(4)}° N, {incident.lng.toFixed(4)}° E
        </Text>
        <Text style={styles.telemetryText}>
          Provenance: {incident.provenance} · {incident.report_count} community corroboration{incident.report_count === 1 ? "" : "s"}
        </Text>
      </View>

      {/* Confirmation feedback micro-action */}
      <View style={styles.confirmationRow}>
        <Text style={styles.confirmationLabel}>Still affecting transit?</Text>
        <View style={styles.confirmationPills}>
          <View style={styles.microPill}>
            <Text style={styles.microPillText}>👍 Confirmed ({incident.report_count})</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SegmentSummary({ segments }: { segments: TrafficSegment[] }) {
  if (segments.length === 0) return null;
  const slow = segments.filter((segment) => segment.severity === "slowdown").length;

  return (
    <Card style={styles.segmentBox}>
      <View style={styles.segmentHeader}>
        <Text style={styles.segmentTitle}>Mangaluru Central Corridor</Text>
        <SimulatedBadge label="SIMULATED FLOW" />
      </View>
      <Text style={styles.segmentText}>
        {segments.length} schematic corridor segments monitored. {slow} currently indicate a simulated bottleneck slowdown.
      </Text>
      <Text style={styles.disclaimerMuted}>
        * Corridor segments are demonstration projections, not GPS tracking speeds.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: space.gutter,
    paddingTop: space.sm,
    gap: space.sm,
    backgroundColor: colors.background,
  },
  header: {
    gap: space.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.headlineSm,
    color: colors.text,
  },
  liveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLive: {
    backgroundColor: colors.success,
  },
  dotWarn: {
    backgroundColor: colors.warning,
  },
  dotMuted: {
    backgroundColor: colors.textMuted,
  },
  liveText: {
    ...typography.labelSm,
    color: colors.success,
    fontWeight: "600",
  },
  liveWarn: {
    ...typography.labelSm,
    color: colors.warning,
    fontWeight: "600",
  },
  liveMuted: {
    ...typography.labelSm,
    color: colors.textMuted,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: radius.control,
    backgroundColor: colors.surfaceContainer,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.control - 2,
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    ...typography.labelLg,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  mapArea: {
    flex: 1,
    gap: space.sm,
  },
  details: {
    flex: 1,
  },
  detailsContent: {
    gap: space.sm,
    paddingBottom: space.xl,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  hintIcon: {
    fontSize: 20,
  },
  hint: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  listContent: {
    gap: space.sm,
    paddingBottom: space.xl,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.xs,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  incidentCard: {
    padding: space.md,
    gap: space.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  cardCategoryIcon: {
    fontSize: 20,
  },
  categoryTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  cardBadges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.xs,
  },
  provenancePill: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  provenanceText: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  reasonText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.xs,
  },
  localityText: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  viewOnMapText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: "700",
  },
  selectedDetailCard: {
    padding: space.md,
    gap: space.sm,
    borderColor: colors.primary,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flex: 1,
  },
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCategoryIcon: {
    fontSize: 20,
  },
  detailTitleCol: {
    flex: 1,
  },
  detailEyebrow: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "700",
  },
  detailTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  detailReason: {
    ...typography.bodyMd,
    color: colors.text,
    lineHeight: 20,
  },
  telemetryBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.sm,
    gap: 4,
  },
  telemetryText: {
    ...typography.codeSm,
    color: colors.textSecondary,
  },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.xs,
  },
  confirmationLabel: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  confirmationPills: {
    flexDirection: "row",
    gap: space.xs,
  },
  microPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
  },
  microPillText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: "700",
  },
  segmentBox: {
    padding: space.md,
    gap: space.xs,
    backgroundColor: colors.evidenceSurface,
    borderColor: colors.border,
  },
  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  segmentTitle: {
    ...typography.titleSm,
    color: colors.evidence,
    fontWeight: "700",
  },
  segmentText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  disclaimerMuted: {
    ...typography.codeSm,
    color: colors.textMuted,
    fontSize: 9,
  },
});
