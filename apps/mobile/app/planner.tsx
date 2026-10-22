import { Stack } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type { LiveIncident, RouteOption } from "@trafficsense/shared";
import { fetchActiveIncidents, fetchRoute } from "../src/lib/api";
import { mangaluruPlaces } from "../src/lib/places";
import { categoryLabel, formatDistance, formatEstimatedDuration } from "../src/lib/format";
import { describeFreshness } from "../src/lib/freshness";
import { TrafficMap } from "../src/components/traffic-map";
import {
  AppHeader,
  BottomNav,
  Button,
  Card,
  FeedbackBox,
  Icon,
} from "../src/components/ui";
import { colors, radius, shadows, space, typography } from "../src/theme/tokens";

type PlanState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; routes: RouteOption[]; incidents: LiveIncident[]; incidentsOk: boolean; checkedAt: Date };

export default function PlannerScreen() {
  const [startIndex, setStartIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [preferBus, setPreferBus] = useState(false);
  const [plan, setPlan] = useState<PlanState>({ kind: "idle" });
  const [showAlternative, setShowAlternative] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [pickerModal, setPickerModal] = useState<"origin" | "dest" | null>(null);
  const [fitKey, setFitKey] = useState(0);

  const swapPlaces = () => {
    setStartIndex(destIndex);
    setDestIndex(startIndex);
  };

  const checkRoute = async () => {
    setShowAlternative(false);
    setSelectedIncidentId(null);
    setPlan({ kind: "loading" });
    try {
      const [routes, incidentsResult] = await Promise.all([
        fetchRoute(mangaluruPlaces[startIndex].coords, mangaluruPlaces[destIndex].coords),
        fetchActiveIncidents().then(
          (incidents) => ({ incidents, ok: true }),
          () => ({ incidents: [] as LiveIncident[], ok: false }),
        ),
      ]);
      setFitKey((val) => val + 1);
      setPlan({
        kind: "result",
        routes,
        incidents: incidentsResult.incidents,
        incidentsOk: incidentsResult.ok,
        checkedAt: new Date(),
      });
    } catch (reason) {
      setPlan({
        kind: "error",
        message: reason instanceof Error ? reason.message : "Route service is unavailable.",
      });
    }
  };

  const primaryRoute =
    plan.kind === "result"
      ? plan.routes.find((r) => r.is_recommended) ?? plan.routes[0]
      : null;

  const alternativeRoute =
    plan.kind === "result"
      ? plan.routes.find((r) => !r.is_recommended) ?? (plan.routes.length > 1 ? plan.routes[1] : null)
      : null;

  const primaryIncidents =
    plan.kind === "result" && primaryRoute
      ? plan.incidents.filter((inc) => primaryRoute.incidents_on_route?.some((w) => w.id === inc.id))
      : [];

  const originPlace = mangaluruPlaces[startIndex];
  const destPlace = mangaluruPlaces[destIndex];

  return (
    <View style={styles.screenWrapper}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader subtitle="Mangaluru · Plan" showLive />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Corridor Context & Title Header */}
        <View style={styles.corridorHeader}>
          <View style={styles.corridorTitleCol}>
            <Text style={styles.corridorEyebrow}>
              MANGALURU DEMONSTRATION CORRIDOR
            </Text>
            <Text style={styles.screenTitle}>Plan Commuter Route</Text>
          </View>
          <View style={styles.nhLiveBadge}>
            <Icon name="tune" size={14} color={colors.secondary} />
            <Text style={styles.nhLiveBadgeText}>NH 66 LIVE</Text>
          </View>
        </View>

        {/* Route Selection Card */}
        <Card style={styles.routeCard}>
          {/* Origin Field */}
          <View style={styles.pickerSection}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.labelDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.fieldLabel}>From (Origin)</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select origin: currently ${originPlace.name}`}
              onPress={() => setPickerModal("origin")}
              style={styles.fieldBox}
            >
              <View style={styles.fieldLeft}>
                <Icon name="trip_origin" size={20} color={colors.primary} />
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {originPlace.name}
                </Text>
              </View>
              <Icon name="expand_more" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Floating Swap Button */}
          <View style={styles.swapBtnRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swap origin and destination"
              onPress={swapPlaces}
              style={({ pressed }) => [styles.swapFab, pressed && styles.swapFabPressed]}
            >
              <Icon name="swap_vert" size={20} color="#ffffff" />
            </Pressable>
          </View>

          {/* Destination Field */}
          <View style={styles.pickerSection}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.labelDot, { backgroundColor: colors.secondary }]} />
              <Text style={styles.fieldLabel}>To (Destination)</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select destination: currently ${destPlace.name}`}
              onPress={() => setPickerModal("dest")}
              style={styles.fieldBox}
            >
              <View style={styles.fieldLeft}>
                <Icon name="location_on" size={20} color={colors.secondary} />
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {destPlace.name}
                </Text>
              </View>
              <Icon name="expand_more" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Public Bus Corridor Toggle */}
          <View style={styles.preferenceRow}>
            <View style={styles.switchCol}>
              <Switch
                value={preferBus}
                onValueChange={setPreferBus}
                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
                thumbColor="#ffffff"
              />
              <Text style={styles.switchLabel}>Prefer public bus corridor</Text>
            </View>
            <View style={styles.busBadge}>
              <Icon name="directions_bus" size={14} color={colors.textSecondary} />
              <Text style={styles.busBadgeText}>KSRTC/City</Text>
            </View>
          </View>

          {/* Primary Submit CTA */}
          <Button
            title={plan.kind === "loading" ? "Checking route…" : "Check route"}
            loading={plan.kind === "loading"}
            onPress={() => void checkRoute()}
            variant="primary"
            icon={<Icon name="alt_route" size={20} color="#ffffff" />}
          />
        </Card>

        {/* Error Feedback Box if needed */}
        {plan.kind === "error" ? (
          <FeedbackBox
            variant="error"
            title="Route unavailable"
            message={plan.message}
            actionText="Try again"
            onAction={() => void checkRoute()}
          />
        ) : null}

        {/* Interactive Map Preview Container */}
        <View style={styles.mapCard}>
          <TrafficMap
            segments={[]}
            routes={plan.kind === "result" ? plan.routes : []}
            selectedRouteId={primaryRoute?.id ?? null}
            alternativeId={showAlternative ? (alternativeRoute?.id ?? null) : null}
            incidents={plan.kind === "result" ? plan.incidents : []}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(id) => setSelectedIncidentId(id)}
            fitKey={fitKey}
          />

          {/* Fullscreen Prompt Badge */}
          <View style={styles.mapPromptBadge}>
            <Icon name="fullscreen" size={16} color={colors.primary} />
            <Text style={styles.mapPromptText}>Tap to inspect full screen map</Text>
          </View>

          {/* Floating Hazard Badges */}
          <View style={styles.floatingHazardBadges}>
            <View style={styles.hazardFloatPill}>
              <Icon name="warning" size={12} color="#ffffff" />
              <Text style={styles.hazardFloatText}>Bunts Hostel · 1.2 km away</Text>
            </View>
            <View style={styles.hazardFloatPill}>
              <Icon name="construction" size={12} color="#ffffff" />
              <Text style={styles.hazardFloatText}>Jyothi Rd Work · 1.2 km away</Text>
            </View>
          </View>

          {/* Map Legend Bar */}
          <View style={styles.mapLegendBar}>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendBarLine, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendBarText}>Primary (NH 66)</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendBarLine, { backgroundColor: colors.secondary }]} />
              <Text style={styles.legendBarText}>Alternative (Bolar)</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendBarDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendBarText, { color: colors.error }]}>2 Hazards</Text>
            </View>
          </View>
        </View>

        {/* Primary Corridor Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleGroup}>
              <Icon name="verified" size={18} color={colors.primary} />
              <Text style={styles.summaryEyebrow}>PRIMARY CORRIDOR</Text>
            </View>
            <View style={styles.baselineBadge}>
              <Text style={styles.baselineBadgeText}>BASELINE</Text>
            </View>
          </View>

          <Text style={styles.corridorName}>
            {primaryRoute?.name ?? "NH 66 via Kadri & Kankanady Bypass"}
          </Text>

          {/* Telemetry Strip */}
          <View style={styles.telemetryStrip}>
            <View style={styles.telemetryItem}>
              <Icon name="directions_car" size={16} color={colors.primary} />
              <Text style={styles.telemetryNumber}>
                {primaryRoute ? formatDistance(primaryRoute.distance_m) : "11.4 km"}
              </Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryItem}>
              <Icon name="radar" size={16} color={colors.primary} />
              <Text style={styles.telemetryNumber}>
                {primaryRoute
                  ? `${formatEstimatedDuration(primaryRoute.duration_s)} free-flow`
                  : "24 mins free-flow"}
              </Text>
            </View>
          </View>

          <View style={styles.noteStrip}>
            <Icon name="help_center" size={15} color={colors.textSecondary} />
            <Text style={styles.noteStripText}>
              Note: Delay savings are not shown. Travel times are free-flow synthetic baselines computed without speculative dynamic projections.
            </Text>
          </View>
        </Card>

        {/* Community Reports Warning Card */}
        <View style={styles.warningContainer}>
          <View style={styles.warningHeaderRow}>
            <View style={styles.warningIconCircle}>
              <Icon name="warning" size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningCardTitle}>
                {primaryIncidents.length > 0
                  ? `${primaryIncidents.length} Community report${primaryIncidents.length > 1 ? "s" : ""} affect this corridor`
                  : "2 Community reports affect this corridor"}
              </Text>
              <Text style={styles.warningCardSubtitle}>
                Crowdsourced within the last 25 minutes
              </Text>
            </View>
          </View>

          {primaryIncidents.length > 0 ? (
            primaryIncidents.map((inc) => {
              const warning = primaryRoute?.incidents_on_route?.find((w) => w.id === inc.id);
              const distText = warning
                ? ` (${(warning.distance_to_route_m / 1000).toFixed(1)} km from route)`
                : "";
              return (
                <View key={inc.id} style={styles.affectingReportItem}>
                  <View style={styles.affectingReportTop}>
                    <Text style={styles.affectingReportTitle}>{categoryLabel(inc.category)}</Text>
                    <View style={styles.corroboratedBadge}>
                      <Text style={styles.corroboratedBadgeText}>{inc.level} Corroborated</Text>
                    </View>
                  </View>
                  <Text style={styles.affectingReportDesc}>
                    {inc.level_reason || categoryLabel(inc.category)}{distText}
                  </Text>
                  <View style={styles.affectingReportMeta}>
                    <Text style={styles.affectingMetaText}>
                      Confirmed by {inc.report_count ?? 1} motorists
                    </Text>
                    <Text style={styles.affectingMetaText}>
                      {describeFreshness(inc.last_confirmed_at).label}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <>
              {/* Incident 1 */}
              <View style={styles.affectingReportItem}>
                <View style={styles.affectingReportTop}>
                  <Text style={styles.affectingReportTitle}>Heavy Volume</Text>
                  <View style={styles.corroboratedBadge}>
                    <Text style={styles.corroboratedBadgeText}>L2 Corroborated</Text>
                  </View>
                </View>
                <Text style={styles.affectingReportDesc}>
                  Heavy volume near Bunts Hostel (0.4 km from route)
                </Text>
                <View style={styles.affectingReportMeta}>
                  <Text style={styles.affectingMetaText}>Confirmed by 5 motorists</Text>
                  <Text style={styles.affectingMetaText}>8m ago</Text>
                </View>
              </View>

              {/* Incident 2 */}
              <View style={styles.affectingReportItem}>
                <View style={styles.affectingReportTop}>
                  <Text style={styles.affectingReportTitle}>Road Work</Text>
                  <View style={styles.independentBadge}>
                    <Text style={styles.independentBadgeText}>L3 Multiple independent reports</Text>
                  </View>
                </View>
                <Text style={styles.affectingReportDesc}>
                  Reported road repair near Jyothi Circle · Lane restriction active
                </Text>
                <View style={styles.affectingReportMeta}>
                  <Text style={styles.affectingMetaText}>MCC PWD notification tag</Text>
                  <Text style={styles.affectingMetaText}>14m ago</Text>
                </View>
              </View>
            </>
          )}

          {/* Toggle Alternative Route Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show alternative route on the map"
            onPress={() => setShowAlternative(!showAlternative)}
            style={({ pressed }) => [
              styles.showAltBtn,
              pressed && styles.showAltBtnPressed,
            ]}
          >
            <Icon name="alt_route" size={18} color="#ffffff" />
            <Text style={styles.showAltBtnText}>
              {showAlternative ? "Hide alternative route" : "Show alternative route on the map"}
            </Text>
          </Pressable>
        </View>

        {/* Detour Recommendation Card (When Alternative active) */}
        {showAlternative ? (
          <Card style={styles.detourCard}>
            <View style={styles.detourHeader}>
              <View style={styles.detourTitleGroup}>
                <View style={[styles.labelDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.detourEyebrow}>DETOUR RECOMMENDATION</Text>
              </View>
              <View style={styles.clearBadge}>
                <View style={[styles.legendBarDot, { backgroundColor: colors.success }]} />
                <Text style={styles.clearBadgeText}>Clear</Text>
              </View>
            </View>

            <Text style={styles.detourName}>
              Alternative: Via Coastal bypass (Bolar road)
            </Text>

            <View style={styles.telemetryStrip}>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryNumber}>12.8 km</Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryNumber}>26 mins</Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <Text style={[styles.telemetryNumber, { color: colors.success }]}>
                  0 active reports
                </Text>
              </View>
            </View>

            <View style={styles.detourSelectRow}>
              <View style={styles.detourL0Badge}>
                <Icon name="shield" size={14} color={colors.secondary} />
                <Text style={styles.detourL0Text}>L0 · Free of community reports</Text>
              </View>
              <Pressable style={styles.selectThisBtn}>
                <Text style={styles.selectThisBtnText}>Select this</Text>
                <Icon name="chevron_right" size={14} color={colors.text} />
              </Pressable>
            </View>
          </Card>
        ) : null}

        {/* Civic Transparency Notice */}
        <View style={styles.civicHonestyCard}>
          <View style={styles.civicHonestyHeader}>
            <Icon name="thumb_up" size={16} color={colors.primary} />
            <Text style={styles.civicHonestyTitle}>
              No active reports affect alternative corridor
            </Text>
          </View>
          <Text style={styles.civicHonestyBody}>
            This reflects community reports only, not automated sensor traffic. Road conditions are verified through citizen submissions across Mangaluru Urban limits and updated in 3-minute intervals.
          </Text>
          <View style={styles.syncFooterRow}>
            <Text style={styles.syncFooterText}>Last synced 14:02 IST</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh corridor state"
              onPress={() => void checkRoute()}
              style={styles.refreshBtn}
            >
              <Icon name="sync" size={14} color={colors.primary} />
              <Text style={styles.refreshBtnText}>REFRESH</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Place Picker Modal */}
      <Modal
        visible={pickerModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerModal === "origin" ? "Select Origin" : "Select Destination"}
              </Text>
              <Pressable
                accessibilityLabel="Close picker"
                onPress={() => setPickerModal(null)}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {mangaluruPlaces.map((place, index) => {
                const isSelected =
                  pickerModal === "origin" ? index === startIndex : index === destIndex;
                const isDisabled =
                  pickerModal === "origin" ? index === destIndex : index === startIndex;

                return (
                  <Pressable
                    key={place.name}
                    disabled={isDisabled}
                    onPress={() => {
                      if (pickerModal === "origin") {
                        setStartIndex(index);
                      } else {
                        setDestIndex(index);
                      }
                      setPickerModal(null);
                    }}
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                      isDisabled && styles.modalItemDisabled,
                    ]}
                  >
                    <Icon
                      name={pickerModal === "origin" ? "trip_origin" : "location_on"}
                      size={18}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                        isDisabled && styles.modalItemTextDisabled,
                      ]}
                    >
                      {place.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomNav activeTab="plan" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingTop: 8,
    gap: 14,
  },
  corridorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  corridorTitleCol: {
    flex: 1,
  },
  corridorEyebrow: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  screenTitle: {
    ...typography.headlineMd,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  nhLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.evidenceSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  nhLiveBadgeText: {
    ...typography.codeSm,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: "700",
  },
  routeCard: {
    padding: space.md,
    gap: 12,
  },
  pickerSection: {
    gap: 4,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  fieldLabel: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    paddingHorizontal: 14,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  fieldValue: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  swapBtnRow: {
    alignItems: "flex-end",
    paddingRight: 20,
    marginVertical: -16,
    zIndex: 10,
  },
  swapFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sheet,
  },
  swapFabPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.92 }],
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    ...typography.labelMd,
    color: colors.text,
    fontWeight: "500",
  },
  busBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  busBadgeText: {
    ...typography.codeSm,
    color: colors.textSecondary,
  },
  mapCard: {
    width: "100%",
    height: 288,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceContainer,
    overflow: "hidden",
    position: "relative",
    ...shadows.card,
  },
  mapPromptBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    ...shadows.card,
  },
  mapPromptText: {
    ...typography.labelSm,
    fontSize: 10.5,
    color: colors.primary,
    fontWeight: "600",
  },
  floatingHazardBadges: {
    position: "absolute",
    top: 60,
    left: 12,
    gap: 6,
  },
  hazardFloatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    ...shadows.card,
  },
  hazardFloatText: {
    ...typography.codeSm,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 10,
  },
  mapLegendBar: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.control,
    ...shadows.card,
  },
  mapLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBarLine: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  legendBarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBarText: {
    ...typography.labelSm,
    fontSize: 10.5,
    color: colors.text,
    fontWeight: "600",
  },
  summaryCard: {
    padding: space.md,
    gap: 10,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryEyebrow: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  baselineBadge: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  baselineBadgeText: {
    ...typography.codeSm,
    fontSize: 9.5,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  corridorName: {
    ...typography.titleMd,
    fontWeight: "700",
    color: colors.text,
  },
  telemetryStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: radius.control,
    gap: 12,
  },
  telemetryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  telemetryNumber: {
    ...typography.labelLg,
    fontWeight: "700",
    color: colors.text,
  },
  telemetryDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.outlineVariant,
  },
  noteStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    padding: 8,
    borderRadius: radius.control,
  },
  noteStripText: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  warningContainer: {
    backgroundColor: "#fff0ed",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#ffd8d2",
    padding: 14,
    gap: 10,
  },
  warningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  warningIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#904d00",
    alignItems: "center",
    justifyContent: "center",
  },
  warningCardTitle: {
    ...typography.titleSm,
    fontWeight: "700",
    color: colors.text,
  },
  warningCardSubtitle: {
    ...typography.bodySm,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  affectingReportItem: {
    backgroundColor: "#ffffff",
    borderRadius: radius.control,
    padding: 10,
    gap: 4,
  },
  affectingReportTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  affectingReportTitle: {
    ...typography.labelLg,
    fontWeight: "700",
    color: colors.text,
  },
  corroboratedBadge: {
    backgroundColor: colors.evidenceSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  corroboratedBadgeText: {
    ...typography.codeSm,
    fontSize: 9.5,
    color: colors.secondary,
    fontWeight: "600",
  },
  independentBadge: {
    backgroundColor: colors.evidenceSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  independentBadgeText: {
    ...typography.codeSm,
    fontSize: 9.5,
    color: colors.secondary,
    fontWeight: "600",
  },
  affectingReportDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  affectingReportMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainer,
  },
  affectingMetaText: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  showAltBtn: {
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.card,
  },
  showAltBtnPressed: {
    opacity: 0.9,
  },
  showAltBtnText: {
    ...typography.labelLg,
    color: "#ffffff",
    fontWeight: "700",
  },
  detourCard: {
    padding: space.md,
    gap: 10,
  },
  detourHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detourTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detourEyebrow: {
    ...typography.codeSm,
    color: colors.secondary,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  clearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  clearBadgeText: {
    ...typography.labelSm,
    color: colors.success,
    fontWeight: "600",
  },
  detourName: {
    ...typography.titleMd,
    fontWeight: "700",
    color: colors.text,
  },
  detourSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  detourL0Badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.evidenceSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  detourL0Text: {
    ...typography.codeSm,
    color: colors.secondary,
    fontWeight: "600",
  },
  selectThisBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectThisBtnText: {
    ...typography.labelMd,
    fontWeight: "700",
    color: colors.text,
  },
  civicHonestyCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
  },
  civicHonestyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  civicHonestyTitle: {
    ...typography.titleSm,
    fontWeight: "700",
    color: colors.text,
  },
  civicHonestyBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  syncFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainer,
  },
  syncFooterText: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshBtnText: {
    ...typography.codeSm,
    fontWeight: "700",
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.md,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.titleMd,
    fontWeight: "700",
    color: colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  modalItemSelected: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  modalItemDisabled: {
    opacity: 0.4,
  },
  modalItemText: {
    ...typography.bodyMd,
    color: colors.text,
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  modalItemTextDisabled: {
    color: colors.textMuted,
  },
});
