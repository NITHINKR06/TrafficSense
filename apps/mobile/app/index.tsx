import { router, Stack } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { colors, minTouchTarget, radius, space } from "../src/theme/tokens";

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>TrafficSense · Mangaluru</Text>
        <Text style={styles.title}>Report road problems and plan around them.</Text>
        <Text style={styles.body}>
          Share a traffic problem, see current community reports, and check a route with clear information about what is known.
        </Text>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => router.push("/report")} style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>Report a problem →</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/planner")} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Plan my route</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/traffic")} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>View traffic</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(session ? "/workspace" : "/auth/login")}
            style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}
          >
            <Text style={styles.textActionText}>{session ? "Your workspace" : "Sign in"}</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Location is requested only when you choose to submit a report. Traffic information is community-reported and estimated, not live speed data.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", gap: space.sm, padding: space.lg, backgroundColor: colors.background },
  eyebrow: { color: colors.evidence, fontSize: 13, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 32, fontWeight: "800", lineHeight: 39 },
  body: { color: colors.textSecondary, fontSize: 17, lineHeight: 26 },
  actions: { gap: space.sm, marginTop: space.md },
  primary: { minHeight: minTouchTarget + 8, justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.primary, paddingHorizontal: space.md },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  secondary: { minHeight: minTouchTarget + 8, justifyContent: "center", borderRadius: radius.control, borderWidth: 1, borderColor: colors.secondaryBorder, backgroundColor: colors.surface, paddingHorizontal: space.md },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  textAction: { minHeight: minTouchTarget, justifyContent: "center" },
  textActionText: { color: colors.evidence, fontSize: 15, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.85 },
  note: { marginTop: space.md, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
