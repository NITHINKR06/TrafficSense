import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { colors, sharedStyles } from "../src/ui/theme";

export default function WorkspaceScreen() {
  const { session, loading, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/auth/login");
  }, [loading, session]);

  if (loading || !session) {
    return <View style={styles.center}><ActivityIndicator color="#087f7b" /></View>;
  }

  async function leave() {
    setError(null);
    const result = await signOut();
    if (result) {
      setError(result);
      return;
    }
    router.replace("/");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your workspace</Text>
      <Text style={styles.body}>Signed in as {session.user.email ?? "your account"}.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Commuter actions</Text>
        <Text style={styles.note}>Report a disruption, review current evidence, or plan a route. Journey sharing is not available in the mobile app yet.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push("/report")} style={sharedStyles.primaryButton}><Text style={sharedStyles.primaryButtonText}>Report a problem</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/traffic")} style={sharedStyles.secondaryButton}><Text style={sharedStyles.secondaryButtonText}>View traffic</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/planner")} style={sharedStyles.secondaryButton}><Text style={sharedStyles.secondaryButtonText}>Plan my route</Text></Pressable>
      {error ? <Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => void leave()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { ...sharedStyles.screen, justifyContent: "center" },
  title: sharedStyles.title,
  body: sharedStyles.body,
  card: { ...sharedStyles.card, gap: 8 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  note: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  signOut: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  signOutText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});
