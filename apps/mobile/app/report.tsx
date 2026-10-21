import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { reportCategories, type ReportCategory } from "@trafficsense/shared";
import { submitIncident } from "../src/lib/api";
import { useAuth } from "../src/providers/auth-provider";
import { colors, sharedStyles } from "../src/ui/theme";

export default function ReportScreen() {
  const { session } = useAuth();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setMessage(null);
    if (!session) {
      setError("Sign in with a commuter account before submitting a report.");
      return;
    }
    if (!category) {
      setError("Choose what is affecting the road.");
      return;
    }
    setSubmitting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError("Location permission was denied. Allow location access to submit a report.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
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
      setMessage(`Report submitted. The server recorded it as ${result.level}.`);
      setCategory(null);
      setNote("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Report submission is unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Report a problem</Text>
        <Text style={styles.body}>
          Choose one category. Location is requested only when you submit.
        </Text>
        {!session ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/auth/login")} style={styles.signIn}>
            <Text style={styles.signInText}>Sign in to report</Text>
          </Pressable>
        ) : null}
        <View style={styles.grid}>
          {reportCategories.map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ selected: category === value }}
              onPress={() => setCategory(value)}
              style={[styles.category, category === value && styles.selected]}
            >
              <Text style={[styles.categoryText, category === value && styles.selectedText]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          maxLength={300}
          multiline
          onChangeText={setNote}
          placeholder="Optional note (max 300 characters)"
          placeholderTextColor={colors.secondaryText}
          style={styles.note}
          value={note}
        />
        {error ? <Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.submitPressed]}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Submit report</Text>
          )}
        </Pressable>
        {message ? (
          <Pressable accessibilityRole="button" onPress={() => router.replace("/traffic")} style={styles.trafficLink}>
            <Text style={styles.trafficLinkText}>View active traffic reports</Text>
          </Pressable>
        ) : null}
        <Text style={styles.disclaimer}>
          A report is an observation, not proof of a cause. The server decides evidence status.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: sharedStyles.screen,
  title: sharedStyles.title,
  body: sharedStyles.body,
  signIn: { ...sharedStyles.secondaryButton, alignSelf: "flex-start" },
  signInText: { color: colors.primary, fontWeight: "700" },
  grid: { gap: 10 },
  category: { minHeight: 48, justifyContent: "center", paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary },
  categoryText: { color: colors.text, fontSize: 15 },
  selectedText: { color: "#ffffff", fontWeight: "700" },
  note: { ...sharedStyles.input, minHeight: 96, paddingTop: 14, textAlignVertical: "top" },
  message: { padding: 12, borderRadius: 10, backgroundColor: "#e8f7ee", color: colors.primary, fontSize: 14, lineHeight: 20 },
  submit: sharedStyles.primaryButton,
  submitPressed: { backgroundColor: colors.primaryPressed, opacity: 0.9 },
  submitText: sharedStyles.primaryButtonText,
  disclaimer: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  trafficLink: { alignSelf: "flex-start", paddingVertical: 8 },
  trafficLinkText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});
