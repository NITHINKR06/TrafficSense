import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/providers/auth-provider";

export default function RegisterScreen() {
  const { signUp, configurationError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(configurationError);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    const result = await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setMessage("Check your email to confirm your account before signing in.");
      return;
    }
    router.replace("/workspace");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.body}>New accounts start as commuter accounts. Use a password with at least 12 characters.</Text>
      <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" style={styles.input} value={email} />
      <TextInput autoCapitalize="none" secureTextEntry onChangeText={setPassword} placeholder="Password" style={styles.input} value={password} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable disabled={submitting} onPress={() => void submit()} style={styles.button}>
        {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Create account</Text>}
      </Pressable>
      <Link href="/auth/login" style={styles.link}>Already have an account? Sign in</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", gap: 14, padding: 28, backgroundColor: "#f4f1ff" },
  title: { color: "#17142b", fontSize: 32, fontWeight: "800" },
  body: { marginBottom: 12, color: "#514d65", fontSize: 16, lineHeight: 24 },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#ffffff", color: "#17142b", fontSize: 16 },
  error: { color: "#a32d2d", fontSize: 14, lineHeight: 20 },
  message: { color: "#176d55", fontSize: 14, lineHeight: 20 },
  button: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 10, backgroundColor: "#087f7b" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 8, color: "#5c4bb7", fontSize: 15, textAlign: "center" },
});
