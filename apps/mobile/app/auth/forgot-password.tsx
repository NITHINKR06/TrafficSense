import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  Button,
  Icon,
  IconButton,
  TextField,
} from "../../src/components/ui";
import { supabase } from "../../src/lib/supabase";
import { useTheme } from "../../src/theme/theme-provider";
import { radius, space, typography } from "../../src/theme/tokens";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (supabase) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed);
        if (resetErr) {
          setError(resetErr.message);
          return;
        }
      }
      setSent(true);
    } catch {
      setError("Could not send reset link. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 8, 16),
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <IconButton
            accessibilityLabel="Back"
            variant="tonal"
            size={44}
            onPress={() => router.back()}
            style={{ marginLeft: -4 }}
          >
            <Icon name="arrow-left" size={18} color={colors.text} />
          </IconButton>

          <View style={styles.header}>
            <View style={[{ borderRadius: radius.input }, shadows.card]}>
              <Image
                source={require("../../assets/design-icon.png")}
                style={styles.appIcon}
                accessibilityLabel="TrafficSense"
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              We’ll email you a link.
            </Text>
          </View>

          {sent ? (
            <Banner
              variant="accent"
              icon="mail"
              title="Check your email"
              body={`If an account exists for ${email.trim()}, a reset link is on the way.`}
            />
          ) : null}

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!submitting}
              error={error}
            />

            <Button
              title="Send link"
              size="L"
              variant="primary"
              loading={submitting}
              onPress={() => void handleSend()}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    gap: 24,
  },
  header: {
    alignItems: "center",
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.input,
  },
  title: {
    marginTop: 16,
    ...typography.display,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    ...typography.body,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
});
