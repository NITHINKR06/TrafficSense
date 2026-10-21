import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { supabase } from "../src/lib/supabase";
import {
  endJourney,
  loadJourneyWorkspace,
  shareJourney,
  sharePreviewLines,
  startJourney,
  stopJourneyShare,
  type JourneyWorkspace,
  type OrganisationRow,
} from "../src/lib/journeys";
import { Button, Card, FeedbackBox, SimulatedBadge, StatusBadge } from "../src/components/ui";
import { colors, minTouchTarget, radius, space, typography } from "../src/theme/tokens";

export default function JourneysScreen() {
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState<JourneyWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Sharing consent modal / form state
  const [sharingJourneyId, setSharingJourneyId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Protected route: Redirect unauthenticated visitors to sign in with return path.
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
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: "My Journeys" }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const activeJourney = data?.journeys.find((j) => j.status === "active") ?? null;
  const previousJourneys = data?.journeys.filter((j) => j.status === "ended") ?? [];
  const selectedOrg = data?.organisations.find((org) => org.id === selectedOrgId) ?? null;

  async function handleStart() {
    try {
      setBusyAction("start");
      setError(null);
      await startJourney(supabase);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Journey could not be started.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEnd(journeyId: string) {
    try {
      setBusyAction(`end_${journeyId}`);
      setError(null);
      await endJourney(supabase, journeyId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Journey could not be ended.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleConfirmShare() {
    if (!sharingJourneyId || !selectedOrgId || !consentChecked) return;
    try {
      setBusyAction(`share_${sharingJourneyId}_${selectedOrgId}`);
      setError(null);
      await shareJourney(supabase, sharingJourneyId, selectedOrgId);
      setSharingJourneyId(null);
      setSelectedOrgId(null);
      setConsentChecked(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sharing could not be confirmed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStopShare(journeyId: string, orgId: string) {
    try {
      setBusyAction(`stop_${journeyId}_${orgId}`);
      setError(null);
      await stopJourneyShare(supabase, journeyId, orgId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sharing could not be stopped.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "My Journeys & Sharing" }} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.eyebrow}>COMMUTER TRANSIT STATUS</Text>
            <SimulatedBadge label="SIMULATED STATUS" />
          </View>
          <Text style={styles.title}>Commuter journeys</Text>
          <Text style={styles.subtitle}>
            Manage active demonstration corridor journeys. Opt-in to share non-GPS corridor summary status with your employer organization.
          </Text>
        </View>

        {error ? (
          <FeedbackBox
            variant="error"
            message={error}
            actionText="Try again"
            onAction={() => void loadData()}
          />
        ) : null}

        {loading && !data ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading commuter journey workspace…</Text>
          </View>
        ) : null}

        {/* Active Journey Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Journey</Text>
          {activeJourney ? (
            <Card style={styles.activeCard} elevated>
              <View style={styles.activeCardHeader}>
                <View style={styles.activeTitleCol}>
                  <Text style={styles.activeCorridorName}>{activeJourney.corridor_name}</Text>
                  <Text style={styles.activeTimestamp}>
                    Started: {new Date(activeJourney.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <StatusBadge label="ACTIVE COMMUTE" variant="success" />
              </View>

              {/* Active Shares on this journey */}
              {activeJourney.shares.length > 0 ? (
                <View style={styles.sharesBlock}>
                  <Text style={styles.sharesHeading}>Employer Shares on this Journey:</Text>
                  {activeJourney.shares.map((share) => (
                    <View key={share.id} style={styles.shareItem}>
                      <View style={styles.shareItemInfo}>
                        <Text style={styles.shareOrgName}>{share.org_name}</Text>
                        <Text style={styles.shareTimestamp}>
                          Shared at {new Date(share.shared_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Status: {share.status}
                        </Text>
                      </View>
                      {share.status === "active" ? (
                        <Button
                          title="Stop sharing"
                          loading={busyAction === `stop_${activeJourney.id}_${share.org_id}`}
                          disabled={Boolean(busyAction)}
                          onPress={() => void handleStopShare(activeJourney.id, share.org_id)}
                          variant="outline"
                          style={styles.stopShareBtn}
                        />
                      ) : (
                        <StatusBadge label="STOPPED" variant="neutral" />
                      )}
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Actions on Active Journey */}
              <View style={styles.activeActionsRow}>
                <Button
                  title="Share with organisation"
                  disabled={Boolean(busyAction) || Boolean(sharingJourneyId)}
                  onPress={() => {
                    setSharingJourneyId(activeJourney.id);
                    setSelectedOrgId(data?.organisations[0]?.id ?? null);
                    setConsentChecked(false);
                  }}
                  variant="secondary"
                  style={styles.actionFlex}
                />
                <Button
                  title="End journey"
                  loading={busyAction === `end_${activeJourney.id}`}
                  disabled={Boolean(busyAction)}
                  onPress={() => void handleEnd(activeJourney.id)}
                  variant="outline"
                  style={styles.actionFlex}
                />
              </View>
            </Card>
          ) : (
            <Card style={styles.noActiveCard}>
              <Text style={styles.noActiveIcon}>🛣️</Text>
              <Text style={styles.noActiveTitle}>No active journey</Text>
              <Text style={styles.noActiveSubtitle}>
                Start a demonstration corridor commute to test status updates and employer consent sharing.
              </Text>
              <Button
                title="Start demonstration journey"
                loading={busyAction === "start"}
                disabled={Boolean(busyAction)}
                onPress={() => void handleStart()}
                variant="primary"
              />
            </Card>
          )}
        </View>

        {/* Consent Preview and Sharing Form Modal Card */}
        {sharingJourneyId && selectedOrg ? (
          <Card style={styles.consentCard} elevated>
            <View style={styles.consentHeader}>
              <Text style={styles.consentIcon}>🔒</Text>
              <Text style={styles.consentTitle}>Consent Sharing Agreement</Text>
            </View>

            {/* Select Organization */}
            <View style={styles.orgPickerGroup}>
              <Text style={styles.pickerLabel}>Recipient Organisation:</Text>
              <View style={styles.orgChips}>
                {data?.organisations.map((org: OrganisationRow) => {
                  const isSelected = org.id === selectedOrgId;
                  return (
                    <Pressable
                      key={org.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelectedOrgId(org.id)}
                      style={[styles.orgChip, isSelected && styles.orgChipSelected]}
                    >
                      <Text style={[styles.orgChipText, isSelected && styles.orgChipTextSelected]}>
                        {org.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Privacy boundary statements */}
            <View style={styles.previewBox}>
              <Text style={styles.previewHeading}>Exact data disclosure boundary:</Text>
              {sharePreviewLines(selectedOrg.name).map((line, idx) => (
                <Text key={idx} style={styles.previewLine}>
                  • {line}
                </Text>
              ))}
            </View>

            {/* Explicit Consent Checkbox */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentChecked }}
              accessibilityLabel={`I consent to share corridor summary data with ${selectedOrg.name}`}
              onPress={() => setConsentChecked((val) => !val)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkboxBox, consentChecked && styles.checkboxBoxChecked]}>
                {consentChecked ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                I explicitly consent to disclose corridor name and active status to {selectedOrg.name}.
              </Text>
            </Pressable>

            {/* Action Buttons */}
            <View style={styles.consentActionsRow}>
              <Button
                title="Cancel"
                disabled={Boolean(busyAction)}
                onPress={() => {
                  setSharingJourneyId(null);
                  setSelectedOrgId(null);
                  setConsentChecked(false);
                }}
                variant="outline"
                style={styles.actionFlex}
              />
              <Button
                title="Confirm & Share"
                loading={Boolean(busyAction?.startsWith("share_"))}
                disabled={!consentChecked || Boolean(busyAction)}
                onPress={() => void handleConfirmShare()}
                variant="primary"
                style={styles.actionFlex}
              />
            </View>
          </Card>
        ) : null}

        {/* Previous Journeys History */}
        {previousJourneys.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Journeys ({previousJourneys.length})</Text>
            {previousJourneys.slice(0, 5).map((journey) => (
              <Card key={journey.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyCorridor}>{journey.corridor_name}</Text>
                  <StatusBadge label="ENDED" variant="neutral" />
                </View>
                <Text style={styles.historyMeta}>
                  Started: {new Date(journey.started_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  {journey.ended_at ? ` · Ended: ${new Date(journey.ended_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Privacy Note */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Civic Sharing Contract</Text>
          <Text style={styles.disclaimerText}>
            • TrafficSense never shares continuous GPS tracks, device IDs, or exact coordinates with employers.
          </Text>
          <Text style={styles.disclaimerText}>
            • The server enforces authorization boundaries, consent revocation, and organisation membership.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
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
  centerLoading: {
    padding: space.xl,
    alignItems: "center",
    gap: space.sm,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  section: {
    gap: space.sm,
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  activeCard: {
    padding: space.md,
    gap: space.md,
    borderColor: colors.primary,
  },
  activeCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  activeTitleCol: {
    flex: 1,
    gap: 2,
  },
  activeCorridorName: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  activeTimestamp: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  sharesBlock: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.sm,
    gap: space.xs,
  },
  sharesHeading: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  shareItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shareItemInfo: {
    flex: 1,
    gap: 2,
  },
  shareOrgName: {
    ...typography.labelLg,
    color: colors.text,
    fontWeight: "700",
  },
  shareTimestamp: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  stopShareBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  activeActionsRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  actionFlex: {
    flex: 1,
  },
  noActiveCard: {
    alignItems: "center",
    padding: space.lg,
    gap: space.sm,
  },
  noActiveIcon: {
    fontSize: 32,
  },
  noActiveTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  noActiveSubtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  consentCard: {
    padding: space.md,
    gap: space.md,
    borderColor: colors.evidence,
  },
  consentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  consentIcon: {
    fontSize: 20,
  },
  consentTitle: {
    ...typography.titleMd,
    color: colors.evidence,
    fontWeight: "700",
  },
  orgPickerGroup: {
    gap: space.xs,
  },
  pickerLabel: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  orgChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
  },
  orgChip: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orgChipSelected: {
    borderColor: colors.evidence,
    backgroundColor: colors.evidenceSurface,
  },
  orgChipText: {
    ...typography.bodyMd,
    color: colors.text,
  },
  orgChipTextSelected: {
    color: colors.evidence,
    fontWeight: "700",
  },
  previewBox: {
    backgroundColor: colors.evidenceSurface,
    borderRadius: radius.control,
    padding: space.md,
    gap: 4,
  },
  previewHeading: {
    ...typography.labelSm,
    color: colors.evidence,
    fontWeight: "700",
    marginBottom: 2,
  },
  previewLine: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: minTouchTarget,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxChecked: {
    borderColor: colors.evidence,
    backgroundColor: colors.evidence,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  checkboxLabel: {
    ...typography.bodySm,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  consentActionsRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  historyCard: {
    padding: space.md,
    gap: space.xs,
  },
  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyCorridor: {
    ...typography.labelLg,
    color: colors.text,
    fontWeight: "600",
  },
  historyMeta: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  disclaimerBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.md,
    gap: 6,
  },
  disclaimerTitle: {
    ...typography.labelSm,
    color: colors.text,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
