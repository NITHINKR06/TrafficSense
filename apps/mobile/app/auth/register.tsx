import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  PasswordField,
  TextField,
  Toast,
} from "../../src/components/ui";
import { MIN_REGISTRATION_PASSWORD } from "../../src/lib/auth-rules";
import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/theme/theme-provider";
import { radius, space, typography } from "../../src/theme/tokens";

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 1;
  if (pw.length >= 8) score++;
  if (pw.length >= MIN_REGISTRATION_PASSWORD) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, configurationError } = useAuth();
  const { colors, shadows } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(configurationError);
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function submit() {
    setError(null);
    setConfirmationMsg(null);
    setSubmitting(true);
    const result = await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setConfirmationMsg("Check your email to confirm your account before signing in.");
      return;
    }
    router.replace("/workspace");
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
          showsVerticalScrollIndicator={false}
        >
          <IconButton
            accessibilityLabel="Back"
            variant="tonal"
            size={44}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={{ marginLeft: -4 }}
          >
            <Icon name="arrow-left" size={18} color={colors.text} />
          </IconButton>

          <View style={styles.brandHeader}>
            <View style={[{ borderRadius: radius.input }, shadows.card]}>
              <Image
                source={require("../../assets/design-icon.png")}
                style={styles.appIcon}
                accessibilityLabel="TrafficSense"
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              Report hazards and confirm what others see.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={() => setToastMsg("Google sign-in requires OAuth configuration")}
            style={({ pressed }) => [
              styles.googleBtn,
              {
                backgroundColor: pressed ? colors.surface2 : colors.surface,
                borderColor: colors.borderStrong,
              },
            ]}
          >
            <View style={[styles.googleCircle, { borderColor: colors.text2 }]}>
              <Text style={[styles.googleG, { color: colors.text }]}>G</Text>
            </View>
            <Text style={[styles.googleText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text3 }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {confirmationMsg ? (
            <Banner
              variant="accent"
              icon="mail"
              title="Account created"
              body={confirmationMsg}
              actionLabel="Go to sign in"
              onAction={() => router.replace("/auth/login")}
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
            />

            <PasswordField
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError(null);
              }}
              placeholder={`At least ${MIN_REGISTRATION_PASSWORD} characters`}
              autoCapitalize="none"
              editable={!submitting}
              error={error}
            />

            {/* 4-segment strength meter */}
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.strengthSeg,
                    {
                      backgroundColor:
                        strength >= step
                          ? strength >= 3
                            ? colors.accent
                            : colors.warningDot
                          : colors.border,
                    },
                  ]}
                />
              ))}
            </View>

            <Button
              title="Create account"
              size="L"
              variant="primary"
              loading={submitting}
              onPress={() => void submit()}
              style={{ marginTop: 12 }}
            />

            <View style={styles.switchAuthRow}>
              <Text style={[styles.switchAuthText, { color: colors.text2 }]}>
                Have an account?{" "}
              </Text>
              <Pressable hitSlop={8} onPress={() => router.push("/auth/login")}>
                <Text style={[styles.switchAuthLink, { color: colors.accent }]}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.legalLine, { color: colors.text3 }]}>
            {"By continuing you agree to the\n"}
            <Text
              style={{ color: colors.text2, fontWeight: "600", textDecorationLine: "underline" }}
              onPress={() => router.push("/legal")}
            >
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text
              style={{ color: colors.text2, fontWeight: "600", textDecorationLine: "underline" }}
              onPress={() => router.push("/legal")}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={Boolean(toastMsg)}
        message={toastMsg ?? ""}
        onDismiss={() => setToastMsg(null)}
      />
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
  },
  brandHeader: {
    marginTop: 8,
    alignItems: "center",
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.input,
  },
  title: {
    marginTop: 18,
    ...typography.display,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    ...typography.body,
    textAlign: "center",
  },
  googleBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    fontSize: 12,
    fontWeight: "700",
  },
  googleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
  },
  form: {
    gap: 12,
  },
  strengthRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 2,
  },
  strengthSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  switchAuthRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchAuthText: {
    ...typography.secondary,
  },
  switchAuthLink: {
    ...typography.secondary,
    fontWeight: "600",
  },
  legalLine: {
    marginTop: "auto",
    paddingTop: 24,
    textAlign: "center",
    ...typography.small,
    lineHeight: 18,
  },
});
