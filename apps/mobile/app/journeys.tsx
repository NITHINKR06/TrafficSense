import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  BottomNav,
  Button,
  Card,
  Checkbox,
  HeroCard,
  Icon,
  IconButton,
  ListGroup,
  ModalSheet,
  SimulatedTag,
  SwitchControl,
} from "../src/components/ui";
import { formatClock } from "../src/lib/evidence";
import {
  endJourney,
  loadJourneyWorkspace,
  shareJourney,
  sharePreviewLines,
  startJourney,
  stopJourneyShare,
  type JourneyRow,
  type JourneyWorkspace,
} from "../src/lib/journeys";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { radius, size as sizes, space, typography } from "../src/theme/tokens";

function formatHistoryDate(iso: string): { day: string; mon: string } {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return { day: "--", mon: "---" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    mon: new Intl.DateTimeFormat("en-US", { month: "short" }).format(d).toUpperCase(),
  };
}

function formatJourneyDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "Ended";
  const mins = Math.max(
    1,
    Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000),
  );
  return `${mins} min`;
}

export default function JourneysScreen() {
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const { colors, reduceMotion } = useTheme();

  const [data, setData] = useState<JourneyWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const [pulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, reduceMotion]);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace({ pathname: "/auth/login", params: { next: "/journeys" } });
    }
  }, [authLoading, session]);

  const loadData = useCallback(async () => {
    if (!session) return;
    try {
      setError(null);
      const result = await loadJourneyWorkspace(supabase);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Journeys could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (session) void loadData();
    }, [session, loadData]),
  );

  if (authLoading || (!session && loading)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const activeJourney = data?.journeys.find((j) => j.status === "active") ?? null;
  const previousJourneys: JourneyRow[] =
    data?.journeys.filter((j) => j.status === "ended") ?? [];
  const org = data?.organisations[0] ?? null;
  const activeShare = activeJourney?.shares?.find((s) => s.status === "active") ?? null;
  const isSharing = Boolean(activeShare);

  const avgMin =
    previousJourneys.length > 0
      ? Math.round(
          previousJourneys.reduce((sum, j) => {
            if (!j.ended_at) return sum;
            return (
              sum +
              Math.max(
                1,
                Math.round(
                  (new Date(j.ended_at).getTime() - new Date(j.started_at).getTime()) /
                    60_000,
                ),
              )
            );
          }, 0) / previousJourneys.length,
        )
      : null;

  async function handleEndJourney(id: string) {
    Alert.alert("End this journey?", "Your active corridor status will stop updating.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End journey",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setBusy(true);
              await endJourney(supabase, id);
              await loadData();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not end journey.");
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  async function handleToggleShare(next: boolean) {
    if (!activeJourney || !org) return;
    if (next) {
      setConsentChecked(false);
      setConsentOpen(true);
      return;
    }
    try {
      setBusy(true);
      await stopJourneyShare(supabase, activeJourney.id, org.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop sharing.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmShare() {
    if (!activeJourney || !org || !consentChecked) return;
    try {
      setBusy(true);
      await shareJourney(supabase, activeJourney.id, org.id);
      setConsentOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable sharing.");
    } finally {
      setBusy(false);
    }
  }

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const startedClock = activeJourney?.started_at
    ? formatClock(new Date(activeJourney.started_at))
    : "10:14";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 8, 16),
            paddingBottom: sizes.scrollBottomClearance + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Top Bar */}
        <View style={styles.topRow}>
          <IconButton
            accessibilityLabel="Back"
            variant="tonal"
            size={44}
            onPress={() => router.back()}
            style={{ marginLeft: -4 }}
          >
            <Icon name="arrow-left" size={18} color={colors.text} />
          </IconButton>
          <SimulatedTag />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Journeys</Text>

        {error ? (
          <Banner
            variant="danger"
            icon="circle-alert"
            title={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        {/* Active Journey HeroCard OR Empty Card */}
        {activeJourney ? (
          <HeroCard>
            <View style={styles.heroTopRow}>
              <View style={styles.pulseRow}>
                <View style={styles.pulseDotWrap}>
                  {!reduceMotion ? (
                    <Animated.View
                      style={[
                        styles.pulseHalo,
                        {
                          backgroundColor: colors.heroAccent,
                          opacity: pulseOpacity,
                          transform: [{ scale: pulseScale }],
                        },
                      ]}
                    />
                  ) : null}
                  <View style={[styles.pulseCore, { backgroundColor: colors.heroAccent }]} />
                </View>
                <Text style={[styles.onRoadText, { color: colors.heroAccent }]}>
                  On the road
                </Text>
              </View>
              <Text style={[styles.startedText, { color: colors.heroText3 }]}>
                Started {startedClock}
              </Text>
            </View>

            <View>
              <Text style={[styles.routeTitle, { color: colors.heroText }]}>
                {activeJourney.corridor_name}
              </Text>
              <Text style={[styles.corridorSub, { color: colors.heroText2 }]}>
                Simulated corridor status
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressWrap}>
              <View style={[styles.progressTrack, { backgroundColor: colors.heroTrack }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: "62%", backgroundColor: colors.heroAccent },
                  ]}
                />
                <View
                  style={[
                    styles.progressKnob,
                    {
                      left: "62%",
                      backgroundColor: colors.heroText,
                      borderColor: colors.heroAccent,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: colors.heroText3 }]}>Start</Text>
                <Text style={[styles.progressLabel, { color: colors.heroText3 }]}>Destination</Text>
              </View>
            </View>

            {/* Status Tiles */}
            <View style={styles.tilesRow}>
              <View style={[styles.heroTile, { backgroundColor: colors.heroTile }]}>
                <Text style={[styles.heroTileLabel, { color: colors.heroText3 }]}>Started</Text>
                <Text style={[styles.heroTileVal, { color: colors.heroText }]}>{startedClock}</Text>
              </View>
              <View style={[styles.heroTile, { backgroundColor: colors.heroTile }]}>
                <Text style={[styles.heroTileLabel, { color: colors.heroText3 }]}>Sharing</Text>
                <Text
                  style={[
                    styles.heroTileVal,
                    { color: isSharing ? colors.heroAccent : colors.heroText2 },
                  ]}
                >
                  {isSharing ? "Active" : "Off"}
                </Text>
              </View>
            </View>

            <Button
              title="End journey"
              size="L"
              variant="secondary"
              disabled={busy}
              onPress={() => void handleEndJourney(activeJourney.id)}
              style={{
                backgroundColor: "transparent",
                borderColor: colors.heroBorder2,
              }}
              textStyle={{ color: colors.heroText }}
            />
          </HeroCard>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No active journey
            </Text>
            <Text style={[styles.emptySub, { color: colors.text2 }]}>
              Pick a corridor in Plan to track arrival and corridor delays.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                title="Start journey"
                size="M"
                variant="primary"
                loading={busy}
                onPress={() => {
                  setBusy(true);
                  void startJourney(supabase)
                    .then(() => loadData())
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : "Could not start journey."),
                    )
                    .finally(() => setBusy(false));
                }}
              />
              <Button
                title="Start from Plan"
                size="M"
                variant="secondary"
                onPress={() => router.replace("/planner")}
              />
            </View>
          </Card>
        )}

        {/* Employer Share Row */}
        {org ? (
          <View
            style={[
              styles.shareCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.shareIconTile, { backgroundColor: colors.accentSoft }]}>
              <Icon name="briefcase" size={18} color={colors.accent} />
            </View>
            <View style={styles.shareTextCol}>
              <Text style={[styles.shareTitle, { color: colors.text }]}>
                Share with your employer
              </Text>
              <Text style={[styles.shareSub, { color: colors.text3 }]}>
                Corridor status only · never GPS
              </Text>
            </View>
            <SwitchControl
              accessibilityLabel="Share with your employer"
              value={isSharing}
              disabled={!activeJourney || busy}
              onValueChange={(v) => void handleToggleShare(v)}
            />
          </View>
        ) : (
          <Text style={[styles.noOrgCaption, { color: colors.text3 }]}>
            Join your organisation to share status.
          </Text>
        )}

        {/* History */}
        {previousJourneys.length > 0 ? (
          <ListGroup
            title="This week"
            rightLabel={avgMin ? `Avg ${avgMin} min` : undefined}
          >
            {previousJourneys.slice(0, 10).map((item, idx) => {
              const dt = formatHistoryDate(item.started_at);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.historyRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.dateCol}>
                    <Text style={[styles.dateDay, { color: colors.text }]}>{dt.day}</Text>
                    <Text style={[styles.dateMon, { color: colors.text3 }]}>{dt.mon}</Text>
                  </View>
                  <View style={styles.historyTextCol}>
                    <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.corridor_name}
                    </Text>
                    <Text style={[styles.historyDelay, { color: colors.text3 }]} numberOfLines={1}>
                      Ended · {formatClock(new Date(item.ended_at ?? item.started_at))}
                    </Text>
                  </View>
                  <Text style={[styles.historyDur, { color: colors.text }]}>
                    {formatJourneyDuration(item.started_at, item.ended_at)}
                  </Text>
                </View>
              );
            })}
          </ListGroup>
        ) : null}
      </ScrollView>

      {/* First-time Employer Sharing Consent ModalSheet */}
      <ModalSheet visible={consentOpen} onClose={() => setConsentOpen(false)}>
        <View style={styles.consentSheet}>
          <Text style={[styles.consentTitle, { color: colors.text }]}>
            Share corridor status
          </Text>
          <Text style={[styles.consentBody, { color: colors.text2 }]}>
            Only your active corridor status and estimated delay are visible to {org?.name ?? "your employer"}.
          </Text>
          <View
            style={[
              styles.consentBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {sharePreviewLines(org?.name ?? "your employer").map((line) => (
              <Text key={line} style={[styles.consentLine, { color: colors.text2 }]}>
                • {line}
              </Text>
            ))}
          </View>
          <View style={styles.consentCheckRow}>
            <Checkbox
              checked={consentChecked}
              onPress={() => setConsentChecked((c) => !c)}
              accessibilityLabel="I understand what is shared with my employer"
            />
            <Text style={[styles.consentCheckLabel, { color: colors.text }]}>
              Share corridor status only (never GPS coordinates)
            </Text>
          </View>
          <Button
            title="Share"
            size="L-sheet"
            variant="primary"
            disabled={!consentChecked}
            loading={busy}
            onPress={() => void handleConfirmShare()}
          />
        </View>
      </ModalSheet>

      <BottomNav activeTab="me" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    gap: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    marginTop: -4,
    ...typography.display,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pulseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDotWrap: {
    width: 8,
    height: 8,
    position: "relative",
  },
  pulseHalo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  pulseCore: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  onRoadText: {
    ...typography.caption,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  startedText: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  routeTitle: {
    ...typography.title,
  },
  corridorSub: {
    ...typography.caption,
    marginTop: 2,
  },
  progressWrap: {
    gap: 8,
  },
  progressTrack: {
    position: "relative",
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  progressKnob: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    borderWidth: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...typography.small,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroTile: {
    flex: 1,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  heroTileLabel: {
    ...typography.small,
  },
  heroTileVal: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  emptyCard: {
    alignItems: "flex-start",
    gap: 10,
  },
  emptyTitle: {
    ...typography.heading,
  },
  emptySub: {
    ...typography.secondary,
  },
  shareCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shareIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shareTextCol: {
    flex: 1,
    gap: 2,
  },
  shareTitle: {
    ...typography.bodySemibold,
  },
  shareSub: {
    ...typography.small,
  },
  noOrgCaption: {
    ...typography.caption,
    paddingHorizontal: 4,
  },
  historyRow: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dateCol: {
    width: 40,
    alignItems: "center",
  },
  dateDay: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  dateMon: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  historyTextCol: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    ...typography.bodyMedium,
  },
  historyDelay: {
    ...typography.small,
  },
  historyDur: {
    ...typography.bodySemibold,
    fontVariant: ["tabular-nums"],
  },
  consentSheet: {
    paddingTop: 8,
    gap: 16,
  },
  consentTitle: {
    ...typography.title,
  },
  consentBody: {
    ...typography.secondary,
  },
  consentBox: {
    borderRadius: radius.input,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  consentLine: {
    ...typography.caption,
  },
  consentCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  consentCheckLabel: {
    flex: 1,
    ...typography.secondary,
    fontWeight: "500",
  },
});
