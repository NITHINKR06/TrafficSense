import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LiveIncident } from "@trafficsense/shared";
import { TrafficMap } from "../src/components/traffic-map";
import {
  Banner,
  BottomNav,
  categoryIconName,
  categoryTone,
  FilterChip,
  Icon,
  IconButton,
  IncidentRow,
  ListGroup,
  SearchField,
  SegmentedControl,
  SimulatedTag,
  SkeletonBlock,
  StateCard,
  TierBadge,
  Toast,
} from "../src/components/ui";
import { fetchActiveIncidents, submitIncidentFeedback } from "../src/lib/api";
import { formatClock, LIVE_REFRESH_MS } from "../src/lib/evidence";
import { categoryLabel } from "../src/lib/format";
import { describeFreshness } from "../src/lib/freshness";
import { areIncidentListsEqual } from "../src/lib/traffic-equality";
import { useTabBackHandler } from "../src/lib/use-tab-back-handler";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { motion, radius, typography } from "../src/theme/tokens";

type FilterKey = "all" | "flood" | "traffic" | "closed" | "works";

export default function TrafficScreen() {
  useTabBackHandler();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { selected: initialSelected } = useLocalSearchParams<{ selected?: string }>();
  const { session, role } = useAuth();
  const { colors, shadows } = useTheme();

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => formatClock(new Date()));
  const [fitKey, setFitKey] = useState(1);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [confirmCounts, setConfirmCounts] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const carouselRef = useRef<FlatList<LiveIncident>>(null);

  // Sheet snap heights
  const peekHeight = 148 + insets.bottom;
  const halfHeight = Math.min(390 + insets.bottom, Math.round(screenHeight * 0.48));
  const fullHeight = Math.max(halfHeight, screenHeight - insets.top - 64);

  const [sheetSnap, setSheetSnap] = useState<"peek" | "half" | "full">("half");
  const [sheetHeightAnim] = useState(() => new Animated.Value(halfHeight));

  const snapTo = useCallback(
    (target: "peek" | "half" | "full") => {
      setSheetSnap(target);
      const val = target === "peek" ? peekHeight : target === "full" ? fullHeight : halfHeight;
      Animated.timing(sheetHeightAnim, {
        toValue: val,
        duration: motion.duration.sheet,
        easing: motion.easing.glide,
        useNativeDriver: false,
      }).start();
    },
    [peekHeight, halfHeight, fullHeight, sheetHeightAnim],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_e, g) => {
          if (g.dy < -40) {
            snapTo(sheetSnap === "peek" ? "half" : "full");
          } else if (g.dy > 40) {
            snapTo(sheetSnap === "full" ? "half" : "peek");
          }
        },
      }),
    [sheetSnap, snapTo],
  );

  const loadTraffic = useCallback(async () => {
    try {
      const incData = await fetchActiveIncidents();
      setIncidents((prev) => (areIncidentListsEqual(prev, incData) ? prev : incData));
      setLastUpdated(formatClock(new Date()));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTraffic();
      const timer = setInterval(() => void loadTraffic(), LIVE_REFRESH_MS);
      return () => clearInterval(timer);
    }, [loadTraffic]),
  );

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return incidents.filter((inc) => {
      const cat = inc.category.toLowerCase();
      if (
        filter === "flood" &&
        !cat.includes("flood") &&
        !cat.includes("water") &&
        !cat.includes("rain") &&
        !cat.includes("landslide")
      ) {
        return false;
      }
      if (
        filter === "traffic" &&
        !cat.includes("traffic") &&
        !cat.includes("accident") &&
        !cat.includes("breakdown") &&
        !cat.includes("signal") &&
        !cat.includes("vip") &&
        !cat.includes("festival") &&
        !cat.includes("strike")
      ) {
        return false;
      }
      if (
        filter === "closed" &&
        !cat.includes("closed") &&
        !cat.includes("closure") &&
        !cat.includes("police") &&
        !cat.includes("fallen_tree")
      ) {
        return false;
      }
      if (
        filter === "works" &&
        !cat.includes("repair") &&
        !cat.includes("work") &&
        !cat.includes("bridge")
      ) {
        return false;
      }
      if (q) {
        const text = `${categoryLabel(inc.category)} ${inc.level_reason ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [incidents, filter, searchQuery]);

  const effectiveSelectedId = useMemo(() => {
    if (selectedId && filteredIncidents.some((i) => i.id === selectedId)) return selectedId;
    return filteredIncidents[0]?.id ?? null;
  }, [filteredIncidents, selectedId]);

  const handleFeedback = async (incidentId: string, vote: "confirm" | "clear") => {
    if (!session?.access_token) {
      setToastMsg("Sign in to confirm or clear incidents");
      return;
    }
    try {
      const res = await submitIncidentFeedback(incidentId, vote, session.access_token);
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId
            ? {
                ...inc,
                status: (res.status as LiveIncident["status"]) ?? inc.status,
                clear_count: res.clear_count ?? inc.clear_count,
                confirm_count: res.confirm_count ?? inc.confirm_count,
                cleared_at: res.cleared_at ?? inc.cleared_at,
              }
            : inc,
        ),
      );
      if (vote === "confirm") {
        setConfirmCounts((prev) => ({
          ...prev,
          [incidentId]: (prev[incidentId] ?? 0) + 1,
        }));
        setToastMsg("Thanks · confirmation recorded");
      } else if (res.status === "cleared") {
        setToastMsg("Incident marked cleared by commuters");
      } else {
        setToastMsg(`Marked as cleared (${res.clear_count ?? 1}/3)`);
      }
      void loadTraffic();
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : "Could not record feedback");
    }
  };

  useEffect(() => {
    if (initialSelected && filteredIncidents.length > 0) {
      const idx = filteredIncidents.findIndex((i) => i.id === initialSelected);
      if (idx >= 0) {
        const t = setTimeout(() => {
          setSelectedId(initialSelected);
          setActiveCardIndex(idx);
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [initialSelected, filteredIncidents]);

  const handleSelectPin = (id: string) => {
    setSelectedId(id);
    const idx = filteredIncidents.findIndex((i) => i.id === id);
    if (idx >= 0) {
      setActiveCardIndex(idx);
      if (sheetSnap === "peek") snapTo("half");
      carouselRef.current?.scrollToIndex({ index: idx, animated: true });
    }
  };

  const isAuthority =
    role === "authority" ||
    Boolean(session?.user?.email?.toLowerCase().includes("authority"));
  const avatarInitial = (session?.user?.email?.[0] ?? "A").toUpperCase();

  const currentSheetHeight =
    sheetSnap === "peek" ? peekHeight : sheetSnap === "full" ? fullHeight : halfHeight;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Full-bleed Map */}
      <TrafficMap
        fullScreen
        incidents={filteredIncidents}
        segments={[]}
        selectedIncidentId={effectiveSelectedId}
        onSelectIncident={handleSelectPin}
        fitKey={fitKey}
        hideControls={sheetSnap === "full"}
        controlsBottomOffset={currentSheetHeight + 16}
        attributionBottomOffset={currentSheetHeight + 12}
      />

      {/* Top Overlay: Search + FilterChips + Status Pill */}
      <View
        pointerEvents="box-none"
        style={[styles.topOverlay, { top: Math.max(insets.top + 8, 16) }]}
      >
        <View style={styles.searchWrap}>
          <SearchField
            height={52}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search roads or areas"
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Account"
                onPress={() =>
                  router.push(session ? (isAuthority ? "/authority" : "/workspace") : "/auth/login")
                }
                style={[styles.avatarCircle, { backgroundColor: colors.accentSoft }]}
              >
                <Text style={[styles.avatarText, { color: colors.accent }]}>
                  {avatarInitial}
                </Text>
              </Pressable>
            }
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
        >
          <FilterChip
            label={`All · ${incidents.length}`}
            selected={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterChip
            label="Flooding"
            selected={filter === "flood"}
            onPress={() => setFilter("flood")}
          />
          <FilterChip
            label="Traffic"
            selected={filter === "traffic"}
            onPress={() => setFilter("traffic")}
          />
          <FilterChip
            label="Closures"
            selected={filter === "closed"}
            onPress={() => setFilter("closed")}
          />
          <FilterChip
            label="Road works"
            selected={filter === "works"}
            onPress={() => setFilter("works")}
          />
        </ScrollView>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: colors.surface, borderColor: colors.navEdge },
              shadows.sm,
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.statusText, { color: colors.text2 }]}>
              Updated {lastUpdated}
            </Text>
            <SimulatedTag compact />
          </View>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Banner
              variant="danger"
              icon="circle-alert"
              title="Couldn't update"
              body="Showing the last data."
              actionLabel="Try again"
              onAction={() => void loadTraffic()}
            />
          </View>
        ) : null}
      </View>

      {/* Non-modal Draggable MapSheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeightAnim,
            backgroundColor: colors.sheet,
            paddingBottom: 92 + insets.bottom,
          },
          shadows.sheet,
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.sheetDragArea}>
          <View style={[styles.handle, { backgroundColor: colors.handle }]} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleGroup}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Nearby</Text>
              <Text style={[styles.sheetCount, { color: colors.text3 }]}>
                {filteredIncidents.length} {filteredIncidents.length === 1 ? "report" : "reports"}
              </Text>
            </View>
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={(mode) => {
                setViewMode(mode);
                if (mode === "list" && sheetSnap === "peek") snapTo("half");
              }}
              options={[
                { value: "map", label: "Map" },
                { value: "list", label: "List" },
              ]}
            />
          </View>
        </View>

        {loading && filteredIncidents.length === 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <SkeletonBlock height={110} borderRadius={22} />
          </View>
        ) : filteredIncidents.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <StateCard
              variant="empty"
              onAction={() => {
                setFilter("all");
                setSearchQuery("");
              }}
            />
          </View>
        ) : viewMode === "map" ? (
          <View style={styles.carouselWrap}>
            <FlatList
              ref={carouselRef}
              horizontal
              data={filteredIncidents}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={310}
              decelerationRate="fast"
              getItemLayout={(_data, index) => ({
                length: 310,
                offset: 310 * index,
                index,
              })}
              onScrollToIndexFailed={() => {}}
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / 310);
                setActiveCardIndex(idx);
                if (filteredIncidents[idx]) {
                  setSelectedId(filteredIncidents[idx].id);
                }
              }}
              renderItem={({ item }) => {
                const tone = categoryTone(item.category, colors);
                const iconName = categoryIconName(item.category);
                const fresh = describeFreshness(item.last_confirmed_at);
                const happenedFresh = describeFreshness(item.first_reported_at);
                const isCleared = item.status === "cleared" || (item.clear_count ?? 0) >= 3;
                const confirms =
                  confirmCounts[item.id] ?? (item.confirm_count ?? 0) + item.report_count;

                return (
                  <View
                    style={[
                      styles.incidentCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.cardIconTile, { backgroundColor: isCleared ? colors.surface2 : tone.bg }]}>
                        <Icon name={iconName} size={20} color={isCleared ? colors.text3 : tone.fg} />
                      </View>
                      <View style={styles.cardTitleCol}>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                          {categoryLabel(item.category)}
                        </Text>
                        <Text style={[styles.cardMeta, { color: colors.text3 }]} numberOfLines={1}>
                          {isCleared
                            ? `Happened ${happenedFresh.label} · Cleared`
                            : `${fresh.label} · ${item.report_count} ${item.report_count === 1 ? "report" : "reports"}`}
                        </Text>
                      </View>
                      <TierBadge level={item.level} />
                    </View>

                    {item.photo_data_url ? (
                      <Image
                        source={{ uri: item.photo_data_url }}
                        style={styles.cardPhoto}
                        resizeMode="cover"
                      />
                    ) : null}

                    <Text style={[styles.cardDesc, { color: colors.text2 }]} numberOfLines={2}>
                      {isCleared
                        ? `Earlier ${categoryLabel(item.category).toLowerCase()} was cleared by ${item.clear_count ?? 3} commuters.`
                        : item.level_reason || "Reported road hazard along the corridor."}
                    </Text>

                    <View style={styles.cardActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void handleFeedback(item.id, "confirm")}
                        style={({ pressed }) => [
                          styles.stillThereBtn,
                          {
                            backgroundColor: pressed ? colors.border : colors.surface2,
                          },
                        ]}
                      >
                        <Text style={[styles.stillThereText, { color: colors.text }]}>
                          Still there · {confirms}
                        </Text>
                      </Pressable>

                      {!isCleared ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void handleFeedback(item.id, "clear")}
                          style={({ pressed }) => [
                            styles.clearedBtn,
                            {
                              borderColor: colors.border,
                              backgroundColor: pressed ? colors.surface2 : "transparent",
                            },
                          ]}
                        >
                          <Text style={[styles.clearedText, { color: colors.text }]}>
                            Cleared{item.clear_count ? ` (${item.clear_count}/3)` : ""}
                          </Text>
                        </Pressable>
                      ) : null}

                      <IconButton
                        variant="accent"
                        size={44}
                        accessibilityLabel="Avoid this area"
                        onPress={() => router.push("/planner")}
                      >
                        <Icon name="route" size={20} color={colors.onAccent} />
                      </IconButton>
                    </View>
                  </View>
                );
              }}
            />

            {filteredIncidents.length > 1 ? (
              <View style={styles.dotsRow}>
                {filteredIncidents.slice(0, 6).map((inc, idx) => (
                  <View
                    key={inc.id}
                    style={[
                      styles.dot,
                      {
                        width: idx === activeCardIndex ? 18 : 6,
                        backgroundColor: idx === activeCardIndex ? colors.text : colors.handle,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listScroll}
            showsVerticalScrollIndicator={false}
          >
            <ListGroup>
              {filteredIncidents.map((inc, idx) => {
                const fresh = describeFreshness(inc.last_confirmed_at);
                return (
                  <IncidentRow
                    key={inc.id}
                    first={idx === 0}
                    category={inc.category}
                    title={categoryLabel(inc.category)}
                    meta={`${inc.level} · ${fresh.label}`}
                    level={inc.level}
                    onPress={() => {
                      setSelectedId(inc.id);
                      setViewMode("map");
                      setFitKey((v) => v + 1);
                    }}
                  />
                );
              })}
            </ListGroup>
          </ScrollView>
        )}
      </Animated.View>

      <Toast
        visible={Boolean(toastMsg)}
        message={toastMsg ?? ""}
        onDismiss={() => setToastMsg(null)}
      />

      <BottomNav activeTab="map" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    gap: 10,
    zIndex: 25,
  },
  searchWrap: {
    paddingHorizontal: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusRow: {
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  statusPill: {
    height: 30,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    zIndex: 30,
  },
  sheetDragArea: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
  sheetHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitleGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  sheetTitle: {
    ...typography.title,
  },
  sheetCount: {
    ...typography.secondary,
    fontVariant: ["tabular-nums"],
  },
  carouselWrap: {
    gap: 12,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  incidentCard: {
    width: 300,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconTile: {
    width: 42,
    height: 42,
    borderRadius: radius.input,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleCol: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardMeta: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  cardPhoto: {
    width: "100%",
    height: 112,
    borderRadius: 12,
  },
  cardDesc: {
    ...typography.secondary,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  stillThereBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.input,
    alignItems: "center",
    justifyContent: "center",
  },
  stillThereText: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  clearedBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clearedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  listScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
