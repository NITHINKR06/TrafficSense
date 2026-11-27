import { router, Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AuthorityNotificationItem, LiveIncident } from "@trafficsense/shared";
import {
  Banner,
  BottomNav,
  Button,
  categoryIconName,
  categoryTone,
  Icon,
  IconButton,
  SegmentedControl,
  StateCard,
  TierBadge,
  Toast,
} from "../src/components/ui";
import {
  fetchAuthorityHistory,
  fetchAuthorityIncidents,
  fetchAuthorityNotifications,
  updateAuthorityIncident,
  type AuthorityIncidentAction,
} from "../src/lib/authority";
import { formatClock } from "../src/lib/evidence";
import { categoryLabel } from "../src/lib/format";
import { configureNotificationsAsync, dispatchLocalAuthorityNotification } from "../src/lib/notifications";
import type { AuthorityHistoryItem } from "../src/lib/response-parsers";
import { useTabBackHandler } from "../src/lib/use-tab-back-handler";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { radius, size as sizes, space, typography } from "../src/theme/tokens";

type TabMode = "active" | "history";

function actionVerb(action: AuthorityHistoryItem["action"]): string {
  if (action === "confirm_incident") return "Confirmed";
  if (action === "resolve_incident") return "Resolved";
  return "Rejected";
}

export default function AuthorityScreen() {
  useTabBackHandler();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading, role } = useAuth();
  const { colors } = useTheme();

  const isAuthority =
    role === "authority" ||
    Boolean(session?.user?.email?.toLowerCase().includes("authority"));

  const [tab, setTab] = useState<TabMode>("active");
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [history, setHistory] = useState<AuthorityHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<AuthorityNotificationItem[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const seenNotificationIds = useRef<Set<string>>(new Set());
  const isFirstPoll = useRef(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboard = useCallback(async (token: string) => {
    setError(null);
    try {
      const [incData, histData] = await Promise.all([
        fetchAuthorityIncidents(token),
        fetchAuthorityHistory(token),
      ]);
      if (!isMountedRef.current) return;
      setIncidents(incData);
      setHistory(histData);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Could not load control room.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!session || session.user.is_anonymous)) {
      router.replace("/auth/login?next=/authority");
      return;
    }
    if (isAuthority && session?.access_token) {
      const token = session.access_token;
      const t = setTimeout(() => void loadDashboard(token), 0);
      return () => clearTimeout(t);
    }
  }, [authLoading, session, isAuthority, loadDashboard]);

  useEffect(() => {
    if (isAuthority) {
      void configureNotificationsAsync();
    }
  }, [isAuthority]);

  useEffect(() => {
    if (!isAuthority || !session?.access_token) return;
    let mounted = true;
    const token = session.access_token;

    async function poll() {
      try {
        const incoming = await fetchAuthorityNotifications(token);
        if (!mounted) return;
        setNotifications(incoming);
        const fresh = incoming.filter((n) => !seenNotificationIds.current.has(n.id));
        incoming.forEach((n) => seenNotificationIds.current.add(n.id));
        if (!isFirstPoll.current && fresh.length > 0) {
          void dispatchLocalAuthorityNotification(fresh[0]);
          void loadDashboard(token);
        }
        isFirstPoll.current = false;
      } catch {
        // Silent retry
      }
    }

    void poll();
    const timer = setInterval(() => void poll(), 4000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isAuthority, session?.access_token, loadDashboard]);

  async function handleAction(incident: LiveIncident, action: AuthorityIncidentAction) {
    if (!session?.access_token || pendingId) return;
    const run = async () => {
      setPendingId(incident.id);
      try {
        await updateAuthorityIncident(incident.id, action, session.access_token);
        if (!isMountedRef.current) return;
        setToastMsg(
          action === "confirm"
            ? "Confirmed as L6"
            : action === "resolve"
              ? "Incident resolved"
              : "Report rejected",
        );
        await loadDashboard(session.access_token);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : "Action failed.");
      } finally {
        if (isMountedRef.current) setPendingId(null);
      }
    };

    if (action === "reject") {
      Alert.alert(
        "Reject this report?",
        `${categoryLabel(incident.category)} will be removed from active review.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reject", style: "destructive", onPress: () => void run() },
        ],
      );
      return;
    }
    await run();
  }

  if (authLoading || (!session && loading)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const reviewCount = unreadCount > 0 ? unreadCount : incidents.length;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (!session?.access_token) return;
              setRefreshing(true);
              void loadDashboard(session.access_token);
            }}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Control room</Text>
            <View style={styles.roleRow}>
              <Icon name="shield-check" size={14} color={colors.text2} strokeWidth={2.2} />
              <Text style={[styles.roleText, { color: colors.text2 }]}>
                L6 · Municipal ops
              </Text>
            </View>
          </View>
          <IconButton
            accessibilityLabel="Refresh"
            variant="outline"
            size={44}
            onPress={() => {
              if (session?.access_token) void loadDashboard(session.access_token);
            }}
          >
            <Icon name="refresh-cw" size={18} color={colors.text} />
          </IconButton>
        </View>

        {/* Dismissible Warning Banner */}
        {!bannerDismissed && reviewCount > 0 ? (
          <Banner
            variant="warning"
            icon="bell"
            title={`${reviewCount} ${reviewCount === 1 ? "report needs" : "reports need"} review`}
            onDismiss={() => setBannerDismissed(true)}
          />
        ) : null}

        {error ? (
          <Banner
            variant="danger"
            icon="circle-alert"
            title={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        {/* Active / History SegmentedControl */}
        <SegmentedControl
          size="md"
          fullWidth
          value={tab}
          onChange={setTab}
          options={[
            { value: "active", label: `Active · ${incidents.length}` },
            { value: "history", label: "History" },
          ]}
        />

        {tab === "active" ? (
          incidents.length === 0 && !loading ? (
            <StateCard
              variant="empty"
              title="No active reports"
              body="All reported hazards have been reviewed."
              actionLabel="Refresh"
              onAction={() => {
                if (session?.access_token) void loadDashboard(session.access_token);
              }}
            />
          ) : (
            <View style={styles.cardsList}>
              {incidents.map((inc) => {
                const tone = categoryTone(inc.category, colors);
                const iconName = categoryIconName(inc.category);
                const isBusy = pendingId === inc.id;

                return (
                  <View
                    key={inc.id}
                    style={[
                      styles.incidentCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconTile, { backgroundColor: tone.bg }]}>
                        <Icon name={iconName} size={20} color={tone.fg} />
                      </View>
                      <View style={styles.cardTitleCol}>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                          {categoryLabel(inc.category)}
                        </Text>
                        <Text style={[styles.cardMeta, { color: colors.text3 }]} numberOfLines={1}>
                          {inc.report_count} {inc.report_count === 1 ? "confirm" : "confirms"}
                        </Text>
                      </View>
                      <TierBadge level={inc.level} />
                    </View>

                    <View style={styles.actionsRow}>
                      <Button
                        title="Confirm L6"
                        size="M"
                        variant="primary"
                        loading={isBusy}
                        disabled={Boolean(pendingId)}
                        onPress={() => void handleAction(inc, "confirm")}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Resolve"
                        size="M"
                        variant="secondary"
                        disabled={Boolean(pendingId)}
                        onPress={() => void handleAction(inc, "resolve")}
                      />
                      <Button
                        title="Reject"
                        size="M"
                        variant="secondary"
                        disabled={Boolean(pendingId)}
                        onPress={() => void handleAction(inc, "reject")}
                        textStyle={{ color: colors.danger }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )
        ) : (
          <View style={styles.historyList}>
            {history.length === 0 ? (
              <StateCard
                variant="empty"
                title="No recent actions"
                body="Confirmed, resolved, and rejected reports appear here."
              />
            ) : (
              <View
                style={[
                  styles.recentCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {history.slice(0, 15).map((h, idx) => (
                  <View
                    key={h.id}
                    style={[
                      styles.recentRow,
                      idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.recentDot,
                        {
                          backgroundColor:
                            h.action === "reject_incident" ? colors.danger : colors.accent,
                        },
                      ]}
                    />
                    <Text style={[styles.recentText, { color: colors.text }]} numberOfLines={1}>
                      {actionVerb(h.action)} · {h.category ? categoryLabel(h.category) : "Incident"}
                    </Text>
                    <Text style={[styles.recentTime, { color: colors.text3 }]}>
                      {formatClock(new Date(h.created_at))}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recent actions preview when on Active tab */}
        {tab === "active" && history.length > 0 ? (
          <View style={styles.recentSection}>
            <Text style={[styles.recentSectionTitle, { color: colors.text3 }]}>
              Recent actions
            </Text>
            <View
              style={[
                styles.recentCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {history.slice(0, 3).map((h, idx) => (
                <Pressable
                  key={h.id}
                  onPress={() => setTab("history")}
                  style={[
                    styles.recentRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.recentDot,
                      {
                        backgroundColor:
                          h.action === "reject_incident" ? colors.danger : colors.accent,
                      },
                    ]}
                  />
                  <Text style={[styles.recentText, { color: colors.text }]} numberOfLines={1}>
                    {actionVerb(h.action)} · {h.category ? categoryLabel(h.category) : "Incident"}
                  </Text>
                  <Text style={[styles.recentTime, { color: colors.text3 }]}>
                    {formatClock(new Date(h.created_at))}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Toast
        visible={Boolean(toastMsg)}
        message={toastMsg ?? ""}
        onDismiss={() => setToastMsg(null)}
      />

      <BottomNav activeTab="authority" badgeCount={unreadCount} />
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
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    ...typography.display,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  roleText: {
    ...typography.caption,
  },
  cardsList: {
    gap: 14,
  },
  incidentCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.iconTile,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleCol: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.bodySemibold,
  },
  cardMeta: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  historyList: {
    gap: 12,
  },
  recentSection: {
    gap: 8,
  },
  recentSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.48,
    textTransform: "uppercase",
    paddingLeft: 4,
  },
  recentCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  recentRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentText: {
    flex: 1,
    ...typography.secondary,
  },
  recentTime: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
});
