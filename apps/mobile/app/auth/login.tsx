import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/providers/auth-provider";
import { safeReturnPath } from "../../src/lib/auth-rules";
import { colors, minTouchTarget, radius, space } from "../../src/theme/tokens";

export default function LoginScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
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
    // replace() so Back does not return to the sign-in form after success.
    router.replace(safeReturnPath(next));
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Sign in" }} />
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>
        Use your TrafficSense commuter account to submit reports. Public traffic stays available without signing in.
      </Text>
      <TextInput
        accessibilityLabel="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={email}
      />
      <TextInput
        accessibilityLabel="Password"
        autoCapitalize="none"
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={() => void submit()}
        style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
      >
        {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Sign in</Text>}
      </Pressable>
      <Link href="/auth/register" style={styles.link}>Create a commuter account</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", gap: space.sm, padding: space.lg, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  body: { marginBottom: space.sm, color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  input: { minHeight: minTouchTarget + 8, paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  primary: { minHeight: minTouchTarget + 8, justifyContent: "center", alignItems: "center", borderRadius: radius.control, backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  link: { marginTop: space.xs, minHeight: minTouchTarget, paddingVertical: 10, color: colors.evidence, fontSize: 15, textAlign: "center" },
});
