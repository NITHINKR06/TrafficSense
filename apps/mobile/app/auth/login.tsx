import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/providers/auth-provider";

export default function LoginScreen() {
  const { signIn, configurationError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(configurationError);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    router.replace("/workspace");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>Use your TrafficSense account to report problems and manage journeys.</Text>
      <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" style={styles.input} value={email} />
      <TextInput autoCapitalize="none" secureTextEntry onChangeText={setPassword} placeholder="Password" style={styles.input} value={password} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={submitting} onPress={() => void submit()} style={styles.button}>
        {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>
      <Link href="/auth/register" style={styles.link}>Create a commuter account</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 14, padding: 28, backgroundColor: "#f4f1ff" },
  title: { color: "#17142b", fontSize: 32, fontWeight: "800" },
  body: { marginBottom: 12, color: "#514d65", fontSize: 16, lineHeight: 24 },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#ffffff", color: "#17142b", fontSize: 16 },
  error: { color: "#a32d2d", fontSize: 14, lineHeight: 20 },
  button: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: "#087f7b" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 8, color: "#5c4bb7", fontSize: 15, textAlign: "center" },
});
