import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useAuth } from "../../src/providers/auth-provider";
import { colors, sharedStyles } from "../../src/ui/theme";

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>Use your TrafficSense account to report problems and manage journeys.</Text>
      <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.secondaryText} style={sharedStyles.input} value={email} />
      <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="password" secureTextEntry onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.secondaryText} style={sharedStyles.input} value={password} />
      {error ? <Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [sharedStyles.primaryButton, (pressed || submitting) && styles.pressed]}>
        {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push("/auth/register")} style={styles.link}><Text style={styles.linkText}>Create a commuter account</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { ...sharedStyles.screen, justifyContent: "center" },
  title: sharedStyles.title,
  body: { ...sharedStyles.body, marginBottom: 8 },
  pressed: { backgroundColor: colors.primaryPressed, opacity: 0.9 },
  buttonText: sharedStyles.primaryButtonText,
  link: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});
