import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { colors, sharedStyles } from "../src/ui/theme";

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>TRAFFICSENSE · MANGALURU</Text>
      <Text style={styles.title}>Report road problems and plan around them.</Text>
      <Text style={sharedStyles.body}>
        Share a traffic problem, review current community reports, and choose a route with clear information.
      </Text>
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>REPORT → VERIFY → ALERT</Text>
        <Text style={styles.previewText}>Evidence and route information are shown with their limits. TrafficSense does not claim live citywide traffic.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/report")} style={({ pressed }) => [sharedStyles.primaryButton, pressed && styles.pressed]}>
          <Text style={sharedStyles.primaryButtonText}>Report a problem</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/planner")} style={({ pressed }) => [sharedStyles.secondaryButton, pressed && styles.secondaryPressed]}>
          <Text style={sharedStyles.secondaryButtonText}>Plan my route</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/traffic")} style={styles.textAction}>
          <Text style={styles.textActionText}>View active traffic reports</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(session ? "/workspace" : "/auth/login")} style={styles.textAction}>
          <Text style={styles.textActionText}>{session ? "Open workspace" : "Sign in"}</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>Location is requested only when you choose to submit a report or use your location.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...sharedStyles.screen, justifyContent: "center", paddingVertical: 44 },
  eyebrow: {
    color: colors.violet,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { ...sharedStyles.title, fontSize: 36, lineHeight: 43 },
  preview: { ...sharedStyles.card, gap: 8, backgroundColor: colors.violetSurface },
  previewTitle: { color: colors.violet, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  previewText: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  actions: { gap: 12, marginTop: 8 },
  pressed: { backgroundColor: colors.primaryPressed },
  secondaryPressed: { backgroundColor: "#f1f5f9" },
  textAction: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  textActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  note: { color: colors.secondaryText, fontSize: 13, lineHeight: 19, textAlign: "center" },
});
