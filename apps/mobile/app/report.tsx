import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { reportCategories, type ReportCategory } from "@trafficsense/shared";
import { submitIncident } from "../src/lib/api";
import { MobileApiError } from "../src/lib/request";
import { useAuth } from "../src/providers/auth-provider";
import { colors, minTouchTarget, radius, space } from "../src/theme/tokens";

type ReportState =
  | { kind: "idle" }
  | { kind: "error"; message: string; signInRequired?: boolean }
  | { kind: "success"; level: string; levelReason: string };

const LOCATION_DENIED = "Location permission was denied. Allow location in your phone settings to submit a report.";
const LOCATION_UNAVAILABLE = "Your location could not be read. Turn on location services and try again.";

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
      <Stack.Screen options={{ headerShown: true, title: "Report a problem" }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Report a problem</Text>
        <Text style={styles.body}>
          Choose one category. Location is requested only when you submit. A report is an observation, not proof of its cause.
        </Text>

        {!session ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/auth/login", params: { next: "/report" } })}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>Sign in to report</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>What is affecting the road?</Text>
        <View style={styles.grid}>
          {reportCategories.map(([value, label]) => {
            const selected = category === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setCategory(value)}
                style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          accessibilityLabel="Optional note"
          maxLength={300}
          multiline
          onChangeText={setNote}
          placeholder="Optional note (max 300 characters)"
          placeholderTextColor={colors.textMuted}
          style={styles.note}
          value={note}
        />

        {state.kind === "error" ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Text style={styles.error}>{state.message}</Text>
            {state.signInRequired ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/auth/login", params: { next: "/report" } })}
                style={styles.inlineAction}
              >
                <Text style={styles.inlineActionText}>Sign in</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {state.kind === "success" ? (
          <View style={styles.successBox} accessibilityLiveRegion="polite">
            <Text style={styles.success}>Report submitted. The server recorded it as {state.level}.</Text>
            <Text style={styles.successReason}>{state.levelReason}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace("/traffic")} style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>View active traffic reports</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void submit()}
          style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed, submitting && styles.disabled]}
        >
          {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Submit report</Text>}
        </Pressable>

        <Text style={styles.disclaimer}>The server decides the evidence level. Reports from one device do not confirm a disruption on their own.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.sm, padding: space.lg, paddingBottom: space.lg * 2, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  label: { marginTop: space.sm, color: colors.text, fontSize: 15, fontWeight: "700" },
  secondary: { minHeight: minTouchTarget, justifyContent: "center", alignSelf: "stretch", paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.secondaryBorder, backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontWeight: "700", textAlign: "center" },
  grid: { gap: space.xs },
  option: { minHeight: minTouchTarget, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { color: colors.text, fontSize: 15 },
  optionTextSelected: { color: colors.onPrimary, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  note: { minHeight: 90, padding: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, textAlignVertical: "top" },
  errorBox: { padding: space.md, borderRadius: radius.control, backgroundColor: colors.errorSurface, gap: space.xs },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  successBox: { padding: space.md, borderRadius: radius.control, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: space.xs },
  success: { color: colors.success, fontSize: 15, fontWeight: "700", lineHeight: 21 },
  successReason: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  inlineAction: { alignSelf: "flex-start", minHeight: minTouchTarget, justifyContent: "center", paddingVertical: 8 },
  inlineActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  primary: { minHeight: minTouchTarget + 8, justifyContent: "center", alignItems: "center", borderRadius: radius.control, backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  disclaimer: { marginTop: space.xs, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
