import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { reportCategories, type ReportCategory } from "@trafficsense/shared";
import { submitIncident } from "../src/lib/api";
import { MobileApiError } from "../src/lib/request";
import { useAuth } from "../src/providers/auth-provider";
import { Button, Card, FeedbackBox, FormField, SimulatedBadge } from "../src/components/ui";
import { colors, radius, space, typography } from "../src/theme/tokens";

type ReportState =
  | { kind: "idle" }
  | { kind: "error"; message: string; signInRequired?: boolean }
  | { kind: "success"; level: string; levelReason: string };

const LOCATION_DENIED = "Location permission was denied. Allow location in your phone settings to submit a report.";
const LOCATION_UNAVAILABLE = "Your location could not be read. Turn on location services and try again.";

const CATEGORY_META: Record<string, { icon: string; subtitle: string }> = {
  accident: { icon: "🚗", subtitle: "Collisions, vehicle damage" },
  flood: { icon: "🌊", subtitle: "Waterlogging, deep puddles" },
  road_closed: { icon: "⛔", subtitle: "Barricades, full diversion" },
  heavy_traffic: { icon: "🚦", subtitle: "Gridlock, crawling crawl" },
  road_repair: { icon: "🚧", subtitle: "Potholes, excavation, tarring" },
  breakdown: { icon: "🔧", subtitle: "Stalled vehicle, flat tyre" },
  fallen_tree: { icon: "🌲", subtitle: "Branch or pole obstruction" },
  landslide: { icon: "🪨", subtitle: "Slope dirt, rock slide" },
  signal_failure: { icon: "⚠️", subtitle: "Signal dark or blinking" },
  heavy_rain: { icon: "🌧️", subtitle: "Monsoon zero visibility" },
  bridge_maintenance: { icon: "🌉", subtitle: "Span checks, lane limits" },
  police_restriction: { icon: "👮", subtitle: "Security checks, detour" },
  vip_movement: { icon: "🚔", subtitle: "Convoy clearance, halt" },
  strike: { icon: "📢", subtitle: "Protest march, road block" },
  festival: { icon: "🎪", subtitle: "Procession, temple gathering" },
  other: { icon: "❓", subtitle: "Unlisted road obstacle" },
  unknown: { icon: "ℹ️", subtitle: "Unverified obstacle" },
};

// The form is keyed by account so a sign-out or account switch discards any unsent input.
export default function ReportScreen() {
  const { session } = useAuth();
  return <ReportForm key={session?.user.id ?? "guest"} />;
}

function ReportForm() {
  const { session } = useAuth();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<ReportState>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setState({ kind: "idle" });
    if (!session) {
      setState({ kind: "error", message: "Sign in with a commuter account before submitting a report.", signInRequired: true });
      return;
    }
    if (!category) {
      setState({ kind: "error", message: "Choose what is affecting the road first." });
      return;
    }

    setSubmitting(true);
    try {
      // Location is requested only here, after the commuter has chosen to submit.
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setState({ kind: "error", message: LOCATION_DENIED });
        return;
      }

      let position: Location.LocationObject;
      try {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch {
        setState({ kind: "error", message: LOCATION_UNAVAILABLE });
        return;
      }

      const result = await submitIncident(
        {
          category,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          gpsAccuracyM: position.coords.accuracy ?? null,
          gpsFixAt: new Date(position.timestamp).toISOString(),
          note: note.trim() || null,
        },
        session.access_token,
      );
      setState({ kind: "success", level: result.level, levelReason: result.level_reason });
      setCategory(null);
      setNote("");
    } catch (reason) {
      if (reason instanceof MobileApiError && reason.authRequired) {
        setState({ kind: "error", message: "Your session has ended. Sign in again to submit.", signInRequired: true });
      } else if (reason instanceof MobileApiError && reason.status === 429) {
        setState({ kind: "error", message: "You have reported too often. Wait a few minutes and try again." });
      } else {
        setState({
          kind: "error",
          message: reason instanceof Error ? reason.message : "Report submission is unavailable. Try again later.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Report a Problem" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.statusRow}>
              <Text style={styles.eyebrow}>COMMUNITY CITIZEN REPORTING</Text>
              <SimulatedBadge label="CORROBORATION FEED" />
            </View>
            <Text style={styles.title}>Report a road hazard</Text>
            <Text style={styles.subtitle}>
              Tap the primary obstacle currently affecting coastal transit. A report is an observation, not proof of its cause. Location is requested only upon submit.
            </Text>
          </View>

          {/* Guest Sign-in Banner if unauthenticated */}
          {!session ? (
            <FeedbackBox
              variant="warning"
              title="Sign in required to submit"
              message="Anyone can browse the traffic map, but submitting road hazard reports requires an authenticated commuter account."
              actionText="Sign in now"
              onAction={() => router.push({ pathname: "/auth/login", params: { next: "/report" } })}
            />
          ) : null}

          {/* Step 1: Observed Hazard Category Selection Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>1. Observed Hazard</Text>
              <Text style={styles.sectionHint}>Single selection</Text>
            </View>

            <View style={styles.categoryGrid}>
              {reportCategories.map(([value, label]) => {
                const selected = category === value;
                const meta = CATEGORY_META[value] ?? { icon: "⚠️", subtitle: "Road obstruction" };

                return (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setCategory(value)}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      selected && styles.categoryCardSelected,
                      pressed && styles.categoryCardPressed,
                    ]}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
                        <Text style={styles.categoryIcon}>{meta.icon}</Text>
                      </View>
                      {selected ? (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkBadgeText}>✓</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.cardBottomText}>
                      <Text
                        style={[styles.categoryTitle, selected && styles.categoryTitleSelected]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[styles.categorySubtitle, selected && styles.categorySubtitleSelected]}
                        numberOfLines={1}
                      >
                        {meta.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Step 2: Context Details / Note */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>2. Additional Observation Details</Text>
              <Text style={styles.sectionHint}>Optional · max 300 chars</Text>
            </View>

            <FormField
              accessibilityLabel="Optional observation note"
              maxLength={300}
              multiline
              numberOfLines={3}
              onChangeText={setNote}
              placeholder="e.g. Accumulated rainwater near Jyothi circle curbside; 2-wheelers diverted to central lane."
              value={note}
            />
          </View>

          {/* Error Feedback */}
          {state.kind === "error" ? (
            <FeedbackBox
              variant="error"
              message={state.message}
              actionText={state.signInRequired ? "Sign in to account" : undefined}
              onAction={
                state.signInRequired
                  ? () => router.push({ pathname: "/auth/login", params: { next: "/report" } })
                  : undefined
              }
            />
          ) : null}

          {/* Success Feedback */}
          {state.kind === "success" ? (
            <Card style={styles.successCard}>
              <View style={styles.successHeader}>
                <View style={styles.successIconCircle}>
                  <Text style={styles.successCheckIcon}>✓</Text>
                </View>
                <View style={styles.successTextCol}>
                  <Text style={styles.successTitle}>Report recorded successfully</Text>
                  <Text style={styles.successLevelBadge}>Server assigned evidence tier: {state.level}</Text>
                </View>
              </View>
              <Text style={styles.successReason}>{state.levelReason}</Text>
              <Button
                title="View active traffic map →"
                onPress={() => router.replace("/traffic")}
                variant="primary"
              />
            </Card>
          ) : null}

          {/* Submit Action */}
          <Button
            title="Submit report"
            loading={submitting}
            disabled={submitting}
            onPress={() => void submit()}
            variant="primary"
          />

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              • Foreground location is captured at the moment of submission to verify geographic cluster corroboration.
            </Text>
            <Text style={styles.disclaimerText}>
              • The server decides evidence tier progression (L1–L6). Single device reports do not independently confirm a road closure or hazard cause.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
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
  statusRow: {
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
  section: {
    gap: space.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  sectionHint: {
    ...typography.labelSm,
    color: colors.textMuted,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: "47%",
    minHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space.md,
    justifyContent: "space-between",
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  categoryCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 20,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadgeText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  cardBottomText: {
    gap: 2,
    marginTop: space.xs,
  },
  categoryTitle: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  categoryTitleSelected: {
    color: colors.onPrimaryFixed,
  },
  categorySubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
  },
  categorySubtitleSelected: {
    color: colors.onPrimaryFixedVariant,
  },
  successCard: {
    padding: space.md,
    gap: space.sm,
    borderColor: colors.success,
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  successIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  successCheckIcon: {
    color: colors.success,
    fontSize: 18,
    fontWeight: "700",
  },
  successTextCol: {
    flex: 1,
    gap: 2,
  },
  successTitle: {
    ...typography.titleMd,
    color: colors.success,
    fontWeight: "700",
  },
  successLevelBadge: {
    ...typography.codeSm,
    color: colors.evidence,
    fontWeight: "600",
  },
  successReason: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  disclaimerBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.md,
    gap: 6,
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
