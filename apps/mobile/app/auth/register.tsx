import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useAuth } from "../../src/providers/auth-provider";
import { colors, sharedStyles } from "../../src/ui/theme";

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.body}>New accounts start as commuter accounts. Use a password with at least 12 characters.</Text>
      <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.secondaryText} style={sharedStyles.input} value={email} />
      <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="new-password" secureTextEntry onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.secondaryText} style={sharedStyles.input} value={password} />
      {error ? <Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [sharedStyles.primaryButton, (pressed || submitting) && styles.pressed]}>
        {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Create account</Text>}
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.replace("/auth/login")} style={styles.link}><Text style={styles.linkText}>Already have an account? Sign in</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...sharedStyles.screen, justifyContent: "center" },
  title: sharedStyles.title,
  body: { ...sharedStyles.body, marginBottom: 8 },
  message: { padding: 12, borderRadius: 10, backgroundColor: "#e8f7ee", color: colors.primary, fontSize: 14, lineHeight: 20 },
  pressed: { backgroundColor: colors.primaryPressed, opacity: 0.9 },
  buttonText: sharedStyles.primaryButtonText,
  link: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});
