import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { colors, minTouchTarget, radius, space } from "../src/theme/tokens";

export default function WorkspaceScreen() {
  const { session, loading, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Private screen: unauthenticated visitors are sent to sign-in without seeing account data.
  useEffect(() => {
    if (!loading && !session) router.replace("/auth/login");
  }, [loading, session]);

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: "Workspace" }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  async function leave() {
    setError(null);
    setLeaving(true);
    const result = await signOut();
    setLeaving(false);
    if (result) {
      setError(result);
      return;
    }
    // replace() clears private screens from the stack after sign-out.
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Workspace" }} />
      <Text style={styles.title}>Your workspace</Text>
      <Text style={styles.body}>Signed in as {session.user.email ?? "your account"}.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/report")} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        <Text style={styles.primaryText}>Report a problem</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/planner")} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>Plan my route</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/journeys")} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>My journeys and sharing</Text>
      </Pressable>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={leaving} onPress={() => void leave()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        {leaving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.signOutText}>Sign out</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  container: { flex: 1, justifyContent: "center", gap: space.sm, padding: space.lg, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  note: { marginTop: space.xs, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  primary: { minHeight: minTouchTarget + 8, justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.primary, marginTop: space.sm },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  secondary: { minHeight: minTouchTarget + 8, justifyContent: "center", borderRadius: radius.control, borderWidth: 1, borderColor: colors.secondaryBorder, backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  signOut: { minHeight: minTouchTarget + 8, justifyContent: "center", borderRadius: radius.control, borderWidth: 1, borderColor: colors.secondaryBorder, backgroundColor: colors.surface, marginTop: space.md },
  signOutText: { color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.85 },
});
