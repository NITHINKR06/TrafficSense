import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LiveIncident, RouteOption } from "@trafficsense/shared";
import { TrafficMap } from "../src/components/traffic-map";
import {
  Banner,
  BottomNav,
  HeroCard,
  Icon,
  IncidentRow,
  ListGroup,
  SearchField,
  SimulatedTag,
  SkeletonBlock,
  StatTile,
  LiveDot,
  Toast,
} from "../src/components/ui";
import { fetchActiveIncidents, fetchRoute } from "../src/lib/api";
import { formatClock } from "../src/lib/evidence";
import { categoryLabel } from "../src/lib/format";
import { describeFreshness } from "../src/lib/freshness";
import { mangaluruPlaces } from "../src/lib/places";
import { areIncidentListsEqual } from "../src/lib/traffic-equality";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { radius, size as sizes, space, typography } from "../src/theme/tokens";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDayCityLine(): string {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  return `${weekday} · Mangaluru`;
}

function formatArrivalClock(durationMin: number): string {
  const arrival = new Date(Date.now() + durationMin * 60_000);
  return formatClock(arrival);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { session, role } = useAuth();
  const { colors, isDark, shadows } = useTheme();

  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineError, setOfflineError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => formatClock(new Date()));
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDismissed, setConfirmDismissed] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [navCompact, setNavCompact] = useState(false);
  const lastScrollY = useRef(0);

  const isAuthority =
    role === "authority" ||
    Boolean(session?.user?.email?.toLowerCase().includes("authority"));
  const avatarInitial = (session?.user?.email?.[0] ?? "A").toUpperCase();

  const loadHome = useCallback(async () => {
    try {
      const [incData, routeData] = await Promise.all([
        fetchActiveIncidents(),
        fetchRoute(mangaluruPlaces[3].coords, mangaluruPlaces[4].coords).catch(() => []),
      ]);
      setIncidents((prev) => (areIncidentListsEqual(prev, incData) ? prev : incData));
      if (routeData.length > 0) setRoutes(routeData);
      setLastUpdated(formatClock(new Date()));
      setOfflineError(false);
    } catch {
      setOfflineError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
      const interval = setInterval(() => void loadHome(), 30000);
      return () => clearInterval(interval);
    }, [loadHome]),
  );

  const primaryRoute = useMemo(
    () => routes.find((r) => r.is_recommended) ?? routes[0] ?? null,
    [routes],
  );
  const durationMin = primaryRoute ? Math.round(primaryRoute.duration_s / 60) : 18;
  const onRouteCount = primaryRoute?.incidents_on_route?.length ?? (incidents.length > 0 ? 1 : 0);
  const routeCountLabel = `${Math.max(routes.length, 2)} routes`;

  const topIncidents = useMemo(() => incidents.slice(0, 3), [incidents]);
  const promptIncident = !confirmDismissed && topIncidents.length > 0 ? topIncidents[0] : null;

  const handleScroll = (y: number) => {
    const diff = y - lastScrollY.current;
    if (diff > 24 && y > 48) {
      setNavCompact(true);
    } else if (diff < -12 || y <= 24) {
      setNavCompact(false);
    }
    lastScrollY.current = y;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom: sizes.scrollBottomClearance + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadHome();
            }}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerDate, { color: colors.text3 }]}>
              {getDayCityLine()}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {getGreeting()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More options"
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => setMenuOpen(true)}
              hitSlop={4}
              style={({ pressed }) => [
                styles.circleBtn,
                {
                  backgroundColor: isDark ? colors.surface2 : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
                shadows.sm,
              ]}
            >
              <Icon name="ellipsis" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Account"
              onPress={() =>
                router.push(session ? (isAuthority ? "/authority" : "/workspace") : "/auth/login")
              }
              hitSlop={4}
              style={({ pressed }) => [
                styles.circleBtn,
                {
                  backgroundColor: colors.accentSoft,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                {avatarInitial}
              </Text>
            </Pressable>
          </View>
        </View>

        {offlineError ? (
          <Banner
            variant="warning"
            icon="circle-alert"
            title={`You're offline · showing data from ${lastUpdated}`}
            onDismiss={() => setOfflineError(false)}
          />
        ) : null}

        {/* Search Field */}
        <SearchField
          height={56}
          placeholder="Where to?"
          onPress={() => router.push("/planner")}
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Plan route to Work"
              onPress={() => router.push("/planner")}
              style={[styles.workChip, { backgroundColor: colors.surface2 }]}
            >
              <Icon name="briefcase" size={15} color={colors.text} />
              <Text style={[styles.workChipText, { color: colors.text }]}>Work</Text>
            </Pressable>
          }
        />

        {/* Commute HeroCard */}
        {loading && routes.length === 0 ? (
          <View
            style={[
              styles.skeletonHero,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <SkeletonBlock width="55%" height={14} />
            <SkeletonBlock width="40%" height={48} borderRadius={12} />
            <SkeletonBlock width="100%" height={10} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SkeletonBlock width="48%" height={52} borderRadius={16} />
              <SkeletonBlock width="48%" height={52} borderRadius={16} />
            </View>
          </View>
        ) : (
          <HeroCard>
            <View style={styles.heroTopRow}>
              <Text style={[styles.heroRouteLabel, { color: colors.heroText2 }]}>
                To work · Pumpwell Circle
              </Text>
              <Text style={[styles.heroViaLabel, { color: colors.heroText3 }]}>
                via Kadri bypass
              </Text>
            </View>

            <View style={styles.heroMetricsRow}>
              <View style={styles.heroMinRow}>
                <Text style={[styles.heroMinutes, { color: colors.heroText }]}>
                  {durationMin}
                </Text>
                <Text style={[styles.heroUnit, { color: colors.heroText }]}>min</Text>
              </View>
              <View style={styles.heroArriveCol}>
                <Text style={[styles.heroArrive, { color: colors.heroText }]}>
                  Arrive {formatArrivalClock(durationMin)}
                </Text>
              </View>
            </View>

            <View style={styles.heroBarWrap}>
              <View style={styles.heroBarRow}>
                <View style={[styles.heroStartRing, { borderColor: colors.heroAccent }]} />
                <View style={[styles.heroSeg, { flex: 40, backgroundColor: colors.heroAccent }]} />
                <View
                  style={[
                    styles.heroSeg,
                    {
                      flex: 16,
                      backgroundColor: onRouteCount > 0 ? colors.heroWarn : colors.heroAccent,
                    },
                  ]}
                />
                <View style={[styles.heroSeg, { flex: 44, backgroundColor: colors.heroAccent }]} />
                <View style={[styles.heroEndDot, { backgroundColor: colors.heroText }]} />
              </View>
              <View style={styles.heroBarLabels}>
                <Text style={[styles.heroBarLabel, { color: colors.heroText3 }]}>Ladyhill</Text>
                {onRouteCount > 0 ? (
                  <Text
                    style={[
                      styles.heroBarLabel,
                      { color: colors.heroWarn, fontWeight: "600" },
                    ]}
                  >
                    Slow · Jyothi
                  </Text>
                ) : (
                  <Text style={[styles.heroBarLabel, { color: colors.heroText3 }]}>
                    Clear corridor
                  </Text>
                )}
                <Text style={[styles.heroBarLabel, { color: colors.heroText3 }]}>Pumpwell</Text>
              </View>
            </View>

            <View style={styles.heroBtnRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start journey"
                onPress={() => router.push(session ? "/journeys" : "/planner")}
                style={({ pressed }) => [
                  styles.heroPrimaryBtn,
                  {
                    backgroundColor: colors.heroAccent,
                    opacity: pressed ? 0.9 : 1,
                    transform: pressed ? [{ scale: 0.97 }] : undefined,
                  },
                ]}
              >
                <Text style={[styles.heroPrimaryBtnText, { color: colors.onAccent }]}>
                  Start journey
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={routeCountLabel}
                onPress={() => router.push("/planner")}
                style={({ pressed }) => [
                  styles.heroSecondaryBtn,
                  {
                    borderColor: colors.heroBorder2,
                    opacity: pressed ? 0.85 : 1,
                    transform: pressed ? [{ scale: 0.97 }] : undefined,
                  },
                ]}
              >
                <Text style={[styles.heroSecondaryBtnText, { color: colors.heroText }]}>
                  {routeCountLabel}
                </Text>
              </Pressable>
            </View>
          </HeroCard>
        )}

        {/* 3 Stat Tiles */}
        <View style={styles.statsRow}>
          <StatTile
            value={incidents.length}
            label="Reports nearby"
            onPress={() => router.push("/traffic")}
            style={styles.statFlex}
          />
          <StatTile
            value={onRouteCount}
            label="On your route"
            warning={onRouteCount > 0}
            onPress={() => router.push("/planner")}
            style={styles.statFlex}
          />
          <StatTile
            value="14:20"
            label="High tide"
            onPress={() => router.push("/traffic")}
            style={styles.statFlex}
          />
        </View>

        {/* Conditional ConfirmPrompt */}
        {promptIncident ? (
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            <View style={styles.confirmTop}>
              <View style={[styles.confirmIconTile, { backgroundColor: colors.warningSoft }]}>
                <Icon name="droplet" size={22} color={colors.warning} />
              </View>
              <View style={styles.confirmTextCol}>
                <Text style={[styles.confirmTitle, { color: colors.text }]} numberOfLines={2}>
                  Still {categoryLabel(promptIncident.category).toLowerCase()} nearby?
                </Text>
                <Text style={[styles.confirmMeta, { color: colors.text3 }]}>
                  You passed it · {promptIncident.report_count} people confirmed
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Not now"
                hitSlop={10}
                onPress={() => setConfirmDismissed(true)}
                style={styles.confirmDismiss}
              >
                <Icon name="x" size={16} color={colors.text3} />
              </Pressable>
            </View>

            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Yes, still there"
                onPress={() => {
                  setConfirmDismissed(true);
                  setToastMsg("Thanks · confirmation recorded");
                }}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  {
                    backgroundColor: pressed ? colors.border : colors.surface2,
                  },
                ]}
              >
                <Icon name="check" size={18} color={colors.text} strokeWidth={2.2} />
                <Text style={[styles.confirmBtnText, { color: colors.text }]}>Yes</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cleared"
                onPress={() => {
                  setConfirmDismissed(true);
                  setToastMsg("Thanks · marked as cleared");
                }}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  {
                    backgroundColor: pressed ? colors.border : colors.surface2,
                  },
                ]}
              >
                <Icon name="x" size={18} color={colors.text} strokeWidth={2.2} />
                <Text style={[styles.confirmBtnText, { color: colors.text }]}>Cleared</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Around you */}
        <View style={styles.aroundSection}>
          <View style={styles.aroundHeader}>
            <View style={styles.aroundTitleGroup}>
              <Text style={[styles.aroundTitle, { color: colors.text }]}>Around you</Text>
              <LiveDot time={lastUpdated} />
              <SimulatedTag compact />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open map"
              hitSlop={8}
              onPress={() => router.push("/traffic")}
            >
              <Text style={[styles.openMapLink, { color: colors.accent }]}>Open map</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open live map"
            onPress={() => router.push("/traffic")}
            style={[styles.miniMapWrap, { borderColor: colors.border }]}
          >
            <TrafficMap
              incidents={incidents}
              segments={[]}
              selectedIncidentId={null}
              onSelectIncident={() => router.push("/traffic")}
              fitKey={1}
              mapHeight={168}
              hideControls
              hideAttribution
            />
            <View style={[styles.miniMapChip, { backgroundColor: colors.surface }, shadows.sm]}>
              <Text style={[styles.miniMapChipText, { color: colors.text }]}>
                {incidents.length} {incidents.length === 1 ? "report" : "reports"} within 2 km
              </Text>
            </View>
          </Pressable>

          {topIncidents.length > 0 ? (
            <ListGroup>
              {topIncidents.map((inc, idx) => {
                const fresh = describeFreshness(inc.last_confirmed_at);
                const title = categoryLabel(inc.category);
                const meta = `${inc.level} · ${fresh.label}`;
                return (
                  <IncidentRow
                    key={inc.id}
                    first={idx === 0}
                    category={inc.category}
                    title={title}
                    meta={meta}
                    level={inc.level}
                    onPress={() =>
                      router.push({ pathname: "/traffic", params: { selected: inc.id } })
                    }
                  />
                );
              })}
            </ListGroup>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerPrivacyRow}>
            <Icon name="lock" size={13} color={colors.text3} />
            <Text style={[styles.footerPrivacyText, { color: colors.text3 }]}>
              Location is used only when you report
            </Text>
          </View>
          <View style={styles.footerLinks}>
            <Pressable hitSlop={8} onPress={() => router.push("/legal")}>
              <Text style={[styles.footerLink, { color: colors.text2 }]}>Privacy</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => router.push("/legal")}>
              <Text style={[styles.footerLink, { color: colors.text2 }]}>Terms</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => router.push("/legal")}>
              <Text style={[styles.footerLink, { color: colors.text2 }]}>Licenses</Text>
            </Pressable>
            <Text style={[styles.footerOsm, { color: colors.text3 }]}>© OpenStreetMap</Text>
          </View>
        </View>
      </ScrollView>

      {/* Overflow Menu Modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={[styles.menuBackdrop, { backgroundColor: colors.scrim }]}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                top: Math.max(insets.top + 64, 76),
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              shadows.menu,
            ]}
          >
            {[
              {
                icon: "settings" as const,
                label: "Settings",
                onPress: () => {
                  setMenuOpen(false);
                  router.push(session ? "/workspace" : "/auth/login");
                },
              },
              {
                icon: "circle-help" as const,
                label: "Help & feedback",
                onPress: () => {
                  setMenuOpen(false);
                  router.push("/legal");
                },
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="menuitem"
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.surface2 },
                ]}
              >
                <Icon name={item.icon} size={18} color={colors.text2} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            ))}

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {[
              { icon: "shield" as const, label: "Privacy policy" },
              { icon: "file-text" as const, label: "Terms of use" },
              { icon: "list" as const, label: "Licenses" },
            ].map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="menuitem"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/legal");
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.surface2 },
                ]}
              >
                <Icon name={item.icon} size={18} color={colors.text2} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Toast
        visible={Boolean(toastMsg)}
        message={toastMsg ?? ""}
        onDismiss={() => setToastMsg(null)}
      />

      <BottomNav activeTab="home" compact={navCompact} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    gap: space[5],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  headerDate: {
    ...typography.caption,
  },
  headerTitle: {
    ...typography.display,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  workChip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  workChipText: {
    ...typography.caption,
    fontWeight: "600",
  },
  skeletonHero: {
    borderRadius: radius.hero,
    borderWidth: 1,
    padding: 22,
    gap: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  heroRouteLabel: {
    ...typography.caption,
    fontWeight: "600",
  },
  heroViaLabel: {
    ...typography.caption,
  },
  heroMetricsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  heroMinRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  heroMinutes: {
    ...typography.heroNumber,
  },
  heroUnit: {
    fontSize: 20,
    fontWeight: "600",
  },
  heroArriveCol: {
    alignItems: "flex-end",
  },
  heroArrive: {
    ...typography.bodySemibold,
    fontVariant: ["tabular-nums"],
  },
  heroBarWrap: {
    gap: 8,
  },
  heroBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroStartRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
  },
  heroSeg: {
    height: 6,
    borderRadius: 3,
  },
  heroEndDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  heroBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroBarLabel: {
    ...typography.small,
  },
  heroBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroPrimaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPrimaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  heroSecondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSecondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statFlex: {
    flex: 1,
  },
  confirmCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  confirmTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confirmIconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTextCol: {
    flex: 1,
    gap: 2,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmMeta: {
    ...typography.caption,
  },
  confirmDismiss: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: -6,
    marginRight: -6,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.input,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnText: {
    ...typography.bodySemibold,
  },
  aroundSection: {
    gap: 12,
  },
  aroundHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aroundTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aroundTitle: {
    ...typography.title,
  },
  openMapLink: {
    ...typography.secondary,
    fontWeight: "600",
    paddingVertical: 8,
  },
  miniMapWrap: {
    height: 168,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  miniMapChip: {
    position: "absolute",
    left: 12,
    bottom: 12,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    justifyContent: "center",
  },
  miniMapChipText: {
    ...typography.small,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  footerPrivacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerPrivacyText: {
    ...typography.small,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLink: {
    ...typography.small,
    fontWeight: "600",
  },
  footerOsm: {
    ...typography.small,
  },
  menuBackdrop: {
    flex: 1,
  },
  menuCard: {
    position: "absolute",
    right: 20,
    width: 240,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 6,
  },
  menuItem: {
    height: 44,
    borderRadius: radius.iconTile,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  menuItemText: {
    ...typography.bodyMedium,
  },
  menuDivider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 10,
  },
});
