import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident, RouteOption } from "@trafficsense/shared";
import { apiConfigurationError, fetchActiveIncidents, fetchRoute } from "../src/lib/api";
import { mangaluruPlaces } from "../src/lib/places";
import { summarizeRoutes } from "../src/lib/route-alerts";
import { categoryLabel, formatDistance, formatEstimatedDuration } from "../src/lib/format";
import { evidenceLabel, formatClock } from "../src/lib/evidence";
import { TrafficMap } from "../src/components/traffic-map";
import { Button, Card, EvidenceBadge, FeedbackBox, SimulatedBadge } from "../src/components/ui";
import { colors, minTouchTarget, radius, space, typography } from "../src/theme/tokens";

type PlanState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; routes: RouteOption[]; incidents: LiveIncident[]; incidentsOk: boolean; checkedAt: Date };

function PlaceChoices({
  label,
  selected,
  onSelect,
  disabledIndex,
}: {
  label: string;
  selected: number;
  onSelect: (index: number) => void;
  disabledIndex: number;
}) {
  return (
    <View style={styles.placeBlock}>
      <Text style={styles.placeLabel}>{label}</Text>
      <View style={styles.chipsRow}>
        {mangaluruPlaces.map((place, index) => {
          const isSelected = index === selected;
          const isDisabled = index === disabledIndex;
          return (
            <Pressable
              key={place.name}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              accessibilityLabel={`${label}: ${place.name}`}
              disabled={isDisabled}
              onPress={() => onSelect(index)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                isDisabled && styles.chipDisabled,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {place.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function PlannerScreen() {
  const [startIndex, setStartIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [plan, setPlan] = useState<PlanState>({ kind: "idle" });
  const [alternativeId, setAlternativeId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState(0);

  async function checkRoute() {
    setAlternativeId(null);
    setSelectedIncidentId(null);
    setPlan({ kind: "loading" });
    try {
      // Route and live reports load together so the map can mark which reports affect this route.
      const [routes, incidentsResult] = await Promise.all([
        fetchRoute(mangaluruPlaces[startIndex].coords, mangaluruPlaces[destIndex].coords),
        fetchActiveIncidents().then(
          (incidents) => ({ incidents, ok: true }),
          () => ({ incidents: [] as LiveIncident[], ok: false }),
        ),
      ]);
      const primary = routes.find((route) => route.is_recommended) ?? routes[0];
      setSelectedRouteId(primary?.id ?? null);
      setFitKey((value) => value + 1);
      setPlan({
        kind: "result",
        routes,
        incidents: incidentsResult.incidents,
        incidentsOk: incidentsResult.ok,
        checkedAt: new Date(),
      });
    } catch (reason) {
      setPlan({ kind: "error", message: reason instanceof Error ? reason.message : "Route service is unavailable." });
    }
  }

  const summary = plan.kind === "result" ? summarizeRoutes(plan.routes) : null;
  const selectedIncident =
    plan.kind === "result" ? plan.incidents.find((incident) => incident.id === selectedIncidentId) ?? null : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Plan Route" }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.eyebrow}>ROUTE CORRIDOR PLANNER</Text>
            <SimulatedBadge label="CORRIDOR MODEL" />
          </View>
          <Text style={styles.title}>Plan your coastal commute</Text>
          <Text style={styles.subtitle}>
            Pick start and destination points. Durations are free-flow estimates calculated from road distance and speed limits; delay savings are not assumed.
          </Text>
        </View>

        {apiConfigurationError ? (
          <FeedbackBox variant="error" message={apiConfigurationError} />
        ) : null}

        {/* Origin / Destination Pickers Card */}
        <Card style={styles.plannerCard}>
          <PlaceChoices
            label="Origin (From)"
            selected={startIndex}
            disabledIndex={destIndex}
            onSelect={setStartIndex}
          />
          <View style={styles.divider} />
          <PlaceChoices
            label="Destination (To)"
            selected={destIndex}
            disabledIndex={startIndex}
            onSelect={setDestIndex}
          />

          <Button
            title="Check route"
            loading={plan.kind === "loading"}
            disabled={Boolean(apiConfigurationError) || plan.kind === "loading"}
            onPress={() => void checkRoute()}
            variant="primary"
          />
        </Card>

        {plan.kind === "loading" ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Calculating route corridor & checking active community reports…</Text>
          </View>
        ) : null}

        {plan.kind === "error" ? (
          <FeedbackBox
            variant="error"
            title="Route check unavailable"
            message={plan.message}
            actionText="Try again"
            onAction={() => void checkRoute()}
          />
        ) : null}

        {plan.kind === "result" ? (
          <View style={styles.resultSection}>
            {/* Map Preview */}
            <View style={styles.mapContainer}>
              <View style={styles.mapHeaderRow}>
                <Text style={styles.mapStatus}>Checked at {formatClock(plan.checkedAt)}</Text>
                <SimulatedBadge label="FREE-FLOW ESTIMATE" />
              </View>

              <TrafficMap
                segments={[]}
                incidents={plan.incidents}
                routes={plan.routes}
                alternativeId={alternativeId}
                selectedRouteId={selectedRouteId}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={setSelectedIncidentId}
                onSelectRoute={setSelectedRouteId}
                fitKey={fitKey}
              />

              {!plan.incidentsOk ? (
                <FeedbackBox
                  variant="warning"
                  message="Live reports could not load, so the map shows route geometry only."
                />
              ) : null}
            </View>

            {/* Selected Incident Details Card */}
            {selectedIncident ? (
              <Card style={styles.selectedReportCard} elevated>
                <Text style={styles.reportEyebrow}>SELECTED ROUTE REPORT</Text>
                <Text style={styles.reportTitle}>{categoryLabel(selectedIncident.category)}</Text>
                <EvidenceBadge
                  level={selectedIncident.level}
                  label={evidenceLabel(selectedIncident.level)}
                />
                <Text style={styles.reportReason}>{selectedIncident.level_reason}</Text>
              </Card>
            ) : null}

            {/* Route Incident Warnings */}
            {summary?.kind === "none" ? (
              <Card style={styles.clearCard}>
                <View style={styles.clearHeader}>
                  <Text style={styles.clearIcon}>✓</Text>
                  <Text style={styles.clearTitle}>No active reports on this recommended route</Text>
                </View>
                <Text style={styles.clearNote}>
                  This reflects community reports on file with the server. It does not measure real-time speed congestion.
                </Text>
              </Card>
            ) : null}

            {summary?.kind === "warning" ? (
              <Card style={styles.warningCard}>
                <View style={styles.warnHeader}>
                  <Text style={styles.warnIcon}>⚠️</Text>
                  <Text style={styles.warnTitle}>Active reports along recommended route</Text>
                </View>

                <View style={styles.warnList}>
                  {summary.incidents.map((incident) => (
                    <View key={incident.id} style={styles.warnItem}>
                      <Text style={styles.warnItemTitle}>
                        • {categoryLabel(incident.category)} · {incident.level}
                      </Text>
                      <Text style={styles.warnItemNote}>
                        {incident.label}. Approximately {formatDistance(incident.distance_to_route_m)} from route.
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Explicit Alternative Route Toggle */}
                {summary.alternative ? (
                  <Button
                    title={
                      alternativeId === summary.alternative.id
                        ? "Hide alternative route"
                        : "Show alternative route on map"
                    }
                    onPress={() =>
                      setAlternativeId((current) =>
                        current === summary.alternative!.id ? null : summary.alternative!.id,
                      )
                    }
                    variant={alternativeId === summary.alternative.id ? "outline" : "secondary"}
                  />
                ) : (
                  <Text style={styles.noAlternativeText}>
                    No listed alternative avoids these reports. Allow extra travel buffer time and check again later.
                  </Text>
                )}
              </Card>
            ) : null}

            {/* Recommended Route Card (Teal) */}
            {summary?.primary ? (
              <RouteCard
                route={summary.primary}
                heading="Recommended Route"
                accentColor={colors.primary}
              />
            ) : null}

            {/* Explicit Chosen Alternative Route Card (Violet) */}
            {summary?.kind === "warning" &&
            summary.alternative &&
            alternativeId === summary.alternative.id ? (
              <RouteCard
                route={summary.alternative}
                heading="Chosen Alternative Route"
                accentColor={colors.evidence}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function RouteCard({
  route,
  heading,
  accentColor,
}: {
  route: RouteOption;
  heading: string;
  accentColor: string;
}) {
  return (
    <Card style={[styles.routeCard, { borderColor: accentColor }]}>
      <View style={styles.routeCardTop}>
        <Text style={[styles.routeCardEyebrow, { color: accentColor }]}>{heading}</Text>
        <SimulatedBadge label="FREE-FLOW" />
      </View>
      <Text style={styles.routeName}>{route.name}</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>DISTANCE</Text>
          <Text style={styles.metricValue}>{formatDistance(route.distance_m)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>FREE-FLOW TIME</Text>
          <Text style={styles.metricValue}>{formatEstimatedDuration(route.duration_s)}</Text>
        </View>
      </View>
      <Text style={styles.routeDisclaimer}>
        * Free-flow calculation from posted limits and distance. Real congestion delay is not measured.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.xl * 2,
    gap: space.md,
    backgroundColor: colors.background,
  },
  header: {
    gap: space.xs,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    ...typography.headlineLg,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  plannerCard: {
    padding: space.md,
    gap: space.md,
  },
  placeBlock: {
    gap: space.xs,
  },
  placeLabel: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
  },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.bodyMd,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  loadingBox: {
    padding: space.lg,
    alignItems: "center",
    gap: space.sm,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: "center",
  },
  resultSection: {
    gap: space.md,
  },
  mapContainer: {
    gap: space.xs,
  },
  mapHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapStatus: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  selectedReportCard: {
    padding: space.md,
    gap: space.xs,
    borderColor: colors.primary,
  },
  reportEyebrow: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "700",
  },
  reportTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  reportReason: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  clearCard: {
    padding: space.md,
    gap: space.xs,
    borderColor: colors.success,
    backgroundColor: colors.successSurface,
  },
  clearHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  clearIcon: {
    color: colors.success,
    fontSize: 18,
    fontWeight: "700",
  },
  clearTitle: {
    ...typography.titleSm,
    color: colors.success,
    fontWeight: "700",
  },
  clearNote: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  warningCard: {
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.warningSurface,
    borderColor: colors.warning,
  },
  warnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  warnIcon: {
    fontSize: 18,
  },
  warnTitle: {
    ...typography.titleSm,
    color: colors.warning,
    fontWeight: "700",
  },
  warnList: {
    gap: space.xs,
  },
  warnItem: {
    gap: 2,
  },
  warnItemTitle: {
    ...typography.labelLg,
    color: colors.text,
    fontWeight: "700",
  },
  warnItemNote: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  noAlternativeText: {
    ...typography.bodySm,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  routeCard: {
    padding: space.md,
    gap: space.sm,
    borderWidth: 1.5,
  },
  routeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeCardEyebrow: {
    ...typography.codeSm,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  routeName: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.sm,
  },
  metricItem: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  metricValue: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: space.sm,
  },
  routeDisclaimer: {
    ...typography.codeSm,
    color: colors.textMuted,
    fontSize: 9,
  },
});
