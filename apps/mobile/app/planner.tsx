import { router, Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LiveIncident, RouteOption, TrafficSegment } from "@trafficsense/shared";
import { PlacePickerModal } from "../src/components/PlacePickerModal";
import { TrafficMap } from "../src/components/traffic-map";
import {
  BottomNav,
  Button,
  categoryIconName,
  Icon,
  SimulatedTag,
  SkeletonBlock,
  StateCard,
  Toast,
} from "../src/components/ui";
import { fetchActiveIncidents, fetchRoute, fetchTrafficSegments } from "../src/lib/api";
import { formatClock } from "../src/lib/evidence";
import { categoryLabel, formatDistance, formatEstimatedDuration } from "../src/lib/format";
import { startJourney } from "../src/lib/journeys";
import { mangaluruPlaces } from "../src/lib/places";
import { supabase } from "../src/lib/supabase";
import { useTabBackHandler } from "../src/lib/use-tab-back-handler";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { radius, typography } from "../src/theme/tokens";

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { colors, shadows } = useTheme();

  const [startIndex, setStartIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [customOrigin, setCustomOrigin] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [customDest, setCustomDest] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [startingJourney, setStartingJourney] = useState(false);
  const [preferBus, setPreferBus] = useState(false);
  const [saved, setSaved] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [segments, setSegments] = useState<TrafficSegment[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<"origin" | "dest" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fitKey, setFitKey] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useTabBackHandler(pickerMode === null);

  const loadRoutes = useCallback(
    async (
      fromCoords = customOrigin?.coords ?? mangaluruPlaces[startIndex].coords,
      toCoords = customDest?.coords ?? mangaluruPlaces[destIndex].coords,
    ) => {
      setLoading(true);
      setError(false);
      try {
        const [routeRes, incRes, segRes] = await Promise.all([
          fetchRoute(fromCoords, toCoords),
          fetchActiveIncidents().catch(() => [] as LiveIncident[]),
          fetchTrafficSegments().catch(() => ({ segments: [] as TrafficSegment[] })),
        ]);
        setRoutes(routeRes);
        setIncidents(incRes);
        setSegments(segRes.segments);
        const rec = routeRes.find((r) => r.is_recommended) ?? routeRes[0];
        setSelectedRouteId(rec?.id ?? null);
        setFitKey((v) => v + 1);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [customOrigin, customDest, startIndex, destIndex],
  );

  const [checkedAtMs, setCheckedAtMs] = useState<number>(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setCheckedAtMs(Date.now());
      void loadRoutes(mangaluruPlaces[0].coords, mangaluruPlaces[1].coords);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swapPlaces = () => {
    const prevOrigin = customOrigin;
    const prevDest = customDest;
    const nextStart = destIndex;
    const nextDest = startIndex;
    setStartIndex(nextStart);
    setDestIndex(nextDest);
    setCustomOrigin(prevDest);
    setCustomDest(prevOrigin);
    const fromC = prevDest?.coords ?? mangaluruPlaces[nextStart].coords;
    const toC = prevOrigin?.coords ?? mangaluruPlaces[nextDest].coords;
    void loadRoutes(fromC, toC);
  };

  const activeRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null,
    [routes, selectedRouteId],
  );
  const altRoute = useMemo(
    () => routes.find((r) => r.id !== activeRoute?.id) ?? null,
    [routes, activeRoute],
  );

  const routeHazard = useMemo(() => {
    if (!activeRoute?.incidents_on_route?.length) return null;
    const first = activeRoute.incidents_on_route[0];
    return incidents.find((i) => i.id === first.id) ?? null;
  }, [activeRoute, incidents]);

  const originPlace = customOrigin ?? mangaluruPlaces[startIndex];
  const destPlace = customDest ?? mangaluruPlaces[destIndex];
  const sheetHeightEstimate = 385 + insets.bottom;

  const arrivalTime =
    activeRoute && checkedAtMs > 0
      ? formatClock(new Date(checkedAtMs + Math.round(activeRoute.duration_s / 60) * 60_000))
      : "--:--";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Full-bleed Route Map */}
      <TrafficMap
        fullScreen
        incidents={incidents}
        segments={segments}
        routes={routes}
        alternativeId={altRoute?.id ?? null}
        selectedRouteId={activeRoute?.id ?? null}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={(id) => setSelectedIncidentId(id)}
        onSelectRoute={(id) => setSelectedRouteId(id)}
        fitKey={fitKey}
        showOnlyLocate
        controlsBottomOffset={sheetHeightEstimate + 14}
        attributionBottomOffset={sheetHeightEstimate + 12}
      />

      {/* Floating From / To Card */}
      <View
        style={[
          styles.routeInputCard,
          {
            top: Math.max(insets.top + 8, 16),
            backgroundColor: colors.surface,
            borderColor: colors.navEdge,
          },
          shadows.nav,
        ]}
      >
        <View style={styles.trackCol}>
          <View style={[styles.fromDot, { borderColor: colors.accent }]} />
          <View style={[styles.dottedLine, { borderColor: colors.text3 }]} />
          <Icon name="map-pin" size={14} color={colors.text} />
        </View>

        <View style={styles.fieldsCol}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`From ${originPlace.name}. Tap to change.`}
            onPress={() => setPickerMode("origin")}
            style={styles.placeBtn}
          >
            <Text style={[styles.placeCaption, { color: colors.text3 }]}>From</Text>
            <Text style={[styles.placeValue, { color: colors.text }]} numberOfLines={1}>
              {originPlace.name}
            </Text>
          </Pressable>

          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`To ${destPlace.name}. Tap to change.`}
            onPress={() => setPickerMode("dest")}
            style={styles.placeBtn}
          >
            <Text style={[styles.placeCaption, { color: colors.text3 }]}>To</Text>
            <Text style={[styles.placeValue, { color: colors.text }]} numberOfLines={1}>
              {destPlace.name}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap start and destination"
          onPress={swapPlaces}
          style={({ pressed }) => [
            styles.swapBtn,
            {
              backgroundColor: pressed ? colors.border : colors.surface2,
            },
          ]}
        >
          <Icon name="arrow-up-down" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Bottom Routes Sheet */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.sheet,
            paddingBottom: 92 + insets.bottom,
          },
          shadows.sheet,
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.handle }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Routes</Text>
          <View style={styles.sheetHeaderActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setToastMsg("Departure: Leave now")}
              style={[
                styles.leaveChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.leaveChipText, { color: colors.text }]}>Leave now</Text>
              <Icon name="chevron-down" size={14} color={colors.text2} strokeWidth={2.4} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: preferBus }}
              accessibilityLabel="Prefer bus corridor"
              onPress={() => {
                setPreferBus((v) => !v);
                setToastMsg(!preferBus ? "Bus corridors prioritised" : "All corridors");
              }}
              style={[
                styles.busToggle,
                {
                  backgroundColor: preferBus ? colors.accentSoft : colors.surface,
                  borderColor: preferBus ? colors.accent : colors.border,
                },
              ]}
            >
              <Icon name="bus" size={16} color={preferBus ? colors.accent : colors.text} />
            </Pressable>
          </View>
        </View>

        {loading && routes.length === 0 ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SkeletonBlock width="48%" height={84} borderRadius={20} />
              <SkeletonBlock width="48%" height={84} borderRadius={20} />
            </View>
            <SkeletonBlock height={52} borderRadius={16} />
          </View>
        ) : error ? (
          <StateCard
            variant="error"
            body="The routing service didn't respond."
            onAction={() => void loadRoutes()}
          />
        ) : (
          <>
            {/* Route Radio Tiles */}
            <View accessibilityRole="radiogroup" style={styles.routeTilesRow}>
              {routes.slice(0, 2).map((rt, idx) => {
                const selected = rt.id === activeRoute?.id;
                const mins = formatEstimatedDuration(rt.duration_s);
                const dist = formatDistance(rt.distance_m);
                const subText = rt.avoids_incident
                  ? `No reports · ${dist}`
                  : idx === 0
                    ? `Fastest · ${dist}`
                    : `Alt · ${dist}`;

                return (
                  <Pressable
                    key={rt.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setSelectedRouteId(rt.id)}
                    style={[
                      styles.routeTile,
                      {
                        backgroundColor: selected ? colors.accentSoft : colors.surface,
                        borderColor: selected ? colors.accent : colors.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.routeTileMins, { color: colors.text }]}>{mins}</Text>
                    <Text
                      style={[
                        styles.routeTileSub,
                        {
                          color: selected ? colors.accent : colors.text2,
                          fontWeight: selected ? "600" : "500",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {subText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Traffic-on-route bar */}
            <View style={styles.corridorSection}>
              <View style={styles.corridorTopRow}>
                <Text style={[styles.arriveText, { color: colors.text }]}>
                  Arrive {arrivalTime}{" "}
                  <Text style={{ fontWeight: "400", color: colors.text3 }}>
                    · {activeRoute?.is_recommended ? "Fastest corridor" : "Alternative corridor"}
                  </Text>
                </Text>
                <SimulatedTag label="Corridor model" compact />
              </View>

              <View style={styles.corridorBar}>
                <View style={[styles.corridorSeg, { flex: 38, backgroundColor: colors.accent }]} />
                <View
                  style={[
                    styles.corridorSeg,
                    {
                      flex: 14,
                      backgroundColor: routeHazard ? colors.warningDot : colors.accent,
                    },
                  ]}
                />
                <View style={[styles.corridorSeg, { flex: 48, backgroundColor: colors.accent }]} />
              </View>

              <View style={styles.corridorLabels}>
                <Text style={[styles.corridorLabel, { color: colors.text3 }]} numberOfLines={1}>
                  {originPlace.name.split(" ")[0]}
                </Text>
                <Text style={[styles.corridorLabel, { color: colors.text3 }]} numberOfLines={1}>
                  {routeHazard ? `${categoryLabel(routeHazard.category)} · slow` : "Clear"}
                </Text>
                <Text style={[styles.corridorLabel, { color: colors.text3 }]} numberOfLines={1}>
                  {destPlace.name.split(" ")[0]}
                </Text>
              </View>
            </View>

            {/* Warning Row */}
            {routeHazard ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/traffic", params: { selected: routeHazard.id } })
                }
                style={({ pressed }) => [
                  styles.warningRow,
                  {
                    backgroundColor: colors.warningSoft,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon
                  name={categoryIconName(routeHazard.category)}
                  size={18}
                  color={colors.warning}
                />
                <Text style={[styles.warningTitle, { color: colors.warning }]} numberOfLines={1}>
                  {categoryLabel(routeHazard.category)} on route
                </Text>
                <Text style={[styles.warningLevel, { color: colors.warning }]}>
                  {routeHazard.level}
                </Text>
                <Icon name="chevron-right" size={16} color={colors.warning} />
              </Pressable>
            ) : null}

            {/* Primary Action + Save */}
            <View style={styles.actionRow}>
              <Button
                title="Start journey"
                size="L"
                variant="primary"
                loading={startingJourney}
                onPress={() => {
                  if (!session) {
                    router.push("/auth/login?next=/journeys");
                    return;
                  }
                  setStartingJourney(true);
                  void startJourney(supabase, `${originPlace.name} → ${destPlace.name}`)
                    .then(() => router.push("/journeys"))
                    .catch(() => setToastMsg("Could not start journey. Try again."))
                    .finally(() => setStartingJourney(false));
                }}
                style={{ flex: 1 }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={saved ? "Route saved" : "Save route"}
                onPress={() => {
                  setSaved((v) => !v);
                  setToastMsg(!saved ? "Route saved" : "Removed from saved routes");
                }}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: saved ? colors.accentSoft : colors.surface,
                    borderColor: saved ? colors.accent : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon
                  name="bookmark"
                  size={20}
                  color={saved ? colors.accent : colors.text}
                  filled={saved}
                />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <PlacePickerModal
        visible={pickerMode !== null}
        title={pickerMode === "origin" ? "Choose start" : "Choose destination"}
        selectedIndex={pickerMode === "origin" ? startIndex : destIndex}
        disabledIndex={pickerMode === "origin" ? destIndex : startIndex}
        disabledReason={
          pickerMode === "origin" ? "Already set as destination" : "Already set as start"
        }
        onSelectPreset={(idx) => {
          if (pickerMode === "origin") {
            setCustomOrigin(null);
            setStartIndex(idx);
            void loadRoutes(mangaluruPlaces[idx].coords, destPlace.coords);
          } else {
            setCustomDest(null);
            setDestIndex(idx);
            void loadRoutes(originPlace.coords, mangaluruPlaces[idx].coords);
          }
        }}
        onSelectDeviceLocation={(coords, label) => {
          if (pickerMode === "origin") {
            setCustomOrigin({ name: label, coords });
            void loadRoutes(coords, destPlace.coords);
          } else {
            setCustomDest({ name: label, coords });
            void loadRoutes(originPlace.coords, coords);
          }
        }}
        onClose={() => setPickerMode(null)}
      />

      <Toast
        visible={Boolean(toastMsg)}
        message={toastMsg ?? ""}
        onDismiss={() => setToastMsg(null)}
      />

      <BottomNav activeTab="plan" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  routeInputCard: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    paddingVertical: 4,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 25,
  },
  trackCol: {
    width: 14,
    alignItems: "center",
  },
  fromDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3.5,
  },
  dottedLine: {
    width: 0,
    height: 28,
    borderLeftWidth: 2,
    borderStyle: "dotted",
    marginVertical: 4,
  },
  fieldsCol: {
    flex: 1,
  },
  placeBtn: {
    height: 50,
    justifyContent: "center",
  },
  placeCaption: {
    ...typography.small,
  },
  placeValue: {
    ...typography.bodySemibold,
  },
  fieldDivider: {
    height: 1,
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 14,
    zIndex: 30,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    ...typography.title,
  },
  sheetHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  leaveChip: {
    height: 36,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  leaveChipText: {
    ...typography.caption,
    fontWeight: "600",
  },
  busToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  routeTilesRow: {
    flexDirection: "row",
    gap: 10,
  },
  routeTile: {
    flex: 1,
    height: 84,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    justifyContent: "center",
    gap: 4,
  },
  routeTileMins: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.48,
    fontVariant: ["tabular-nums"],
  },
  routeTileSub: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  corridorSection: {
    gap: 8,
  },
  corridorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  arriveText: {
    ...typography.caption,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  corridorBar: {
    flexDirection: "row",
    gap: 3,
    height: 8,
  },
  corridorSeg: {
    borderRadius: 4,
  },
  corridorLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  corridorLabel: {
    ...typography.label,
    fontWeight: "500",
  },
  warningRow: {
    height: 48,
    borderRadius: radius.input,
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  warningTitle: {
    flex: 1,
    ...typography.secondary,
    fontWeight: "600",
  },
  warningLevel: {
    ...typography.small,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  saveBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
