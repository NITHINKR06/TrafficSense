import * as Location from "expo-location";
import { Stack, router } from "expo-router";
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
      setMessage(`Report submitted. Evidence level: ${result.level}.`);
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
      <Stack.Screen options={{ headerShown: true, title: "Report" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Report a problem</Text>
        <Text style={styles.body}>
          Choose one category. Location is requested only when you submit.
        </Text>
        {!session ? (
          <Pressable onPress={() => router.push("/auth/login")} style={styles.signIn}>
            <Text style={styles.signInText}>Sign in to report</Text>
          </Pressable>
        ) : null}
        <View style={styles.grid}>
          {reportCategories.map(([value, label]) => (
            <Pressable
              key={value}
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
          style={styles.note}
          value={note}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable disabled={submitting} onPress={() => void submit()} style={styles.submit}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Submit report</Text>
          )}
        </Pressable>
        <Text style={styles.disclaimer}>
          A report is an observation, not proof of a cause. The server decides evidence status.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, padding: 24, backgroundColor: "#f4f1ff" },
  title: { color: "#17142b", fontSize: 30, fontWeight: "800" },
  body: { color: "#514d65", fontSize: 16, lineHeight: 24 },
  signIn: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: "#ffffff" },
  signInText: { color: "#087f7b", fontWeight: "700" },
  grid: { gap: 10 },
  category: { padding: 15, borderRadius: 10, backgroundColor: "#ffffff" },
  selected: { backgroundColor: "#087f7b" },
  categoryText: { color: "#17142b", fontSize: 15 },
  selectedText: { color: "#ffffff", fontWeight: "700" },
  note: { minHeight: 90, padding: 14, borderRadius: 10, backgroundColor: "#ffffff", color: "#17142b", textAlignVertical: "top" },
  error: { color: "#a32d2d", fontSize: 14, lineHeight: 20 },
  message: { color: "#176d55", fontSize: 14, lineHeight: 20 },
  submit: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: "#087f7b" },
  submitText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  disclaimer: { color: "#6c687c", fontSize: 13, lineHeight: 19 },
});
