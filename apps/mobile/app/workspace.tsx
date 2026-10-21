import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";

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
    <View style={styles.container}>
      <Text style={styles.title}>Your workspace</Text>
      <Text style={styles.body}>Signed in as {session.user.email ?? "your account"}.</Text>
      <Text style={styles.note}>Private journeys and employer sharing will be connected after the public traffic flow.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={() => void leave()} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, justifyContent: "center", gap: 16, padding: 28, backgroundColor: "#f4f1ff" },
  title: { color: "#17142b", fontSize: 32, fontWeight: "800" },
  body: { color: "#514d65", fontSize: 17, lineHeight: 25 },
  note: { color: "#6c687c", fontSize: 14, lineHeight: 21 },
  error: { color: "#a32d2d", fontSize: 14, lineHeight: 20 },
  button: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: "#087f7b" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});