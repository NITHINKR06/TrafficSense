import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  Button,
  Icon,
  IconButton,
  ListGroup,
  ModalSheet,
  PasswordField,
  SimulatedTag,
  TextField,
  Toast,
} from "../../src/components/ui";
import { safeReturnPath } from "../../src/lib/auth-rules";
import { useAuth } from "../../src/providers/auth-provider";
import { useTheme } from "../../src/theme/theme-provider";
import { radius, space, typography } from "../../src/theme/tokens";

type DemoAccount = {
  label: string;
  sub: string;
  role: "commuter" | "employer" | "authority" | "admin";
  email: string;
  password: string;
  initial: string;
};

const SEEDED_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Commuter · Primary",
    sub: "commuter@demo.trafficsense.test",
    role: "commuter",
    email: "commuter@demo.trafficsense.test",
    password: "9dwxkTxE5YdAEXnGmMuJ5sfdf2h777ix",
    initial: "C",
  },
  {
    label: "Commuter B · Corroborator",
    sub: "commuter-b@demo.trafficsense.test",
    role: "commuter",
    email: "commuter-b@demo.trafficsense.test",
    password: "w7CEllGEJayU78SSrtZDI9jTzo83Owb_",
    initial: "B",
  },
  {
    label: "Traffic Authority · Ops",
    sub: "authority@demo.trafficsense.test",
    role: "authority",
    email: "authority@demo.trafficsense.test",
    password: "1vtM3X1e0Rc6BigIJRIGE-JKgGXDDSvz",
    initial: "A",
  },
  {
    label: "Employer A · Coordinator",
    sub: "employer-a@demo.trafficsense.test",
    role: "employer",
    email: "employer-a@demo.trafficsense.test",
    password: "bfYZVofoGLTBibYmXwKSiGOHY8EfTWmy",
    initial: "E",
  },
];

const IS_PRODUCTION = process.env.EXPO_PUBLIC_APP_ENV === "production";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn, configurationError } = useAuth();
  const { colors, shadows } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(configurationError);
  const [submitting, setSubmitting] = useState(false);
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>(SEEDED_DEMO_ACCOUNTS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (IS_PRODUCTION) return;
    let cancelled = false;
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!apiBaseUrl) return;

    fetch(`${apiBaseUrl}/api/demo-accounts`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok && Array.isArray(data.accounts) && data.accounts.length > 0) {
          const mapped: DemoAccount[] = data.accounts.map(
            (acc: { label?: string; role?: string; email: string; password: string }) => {
              const role = (acc.role ?? "commuter") as DemoAccount["role"];
              const rawLabel = acc.label ?? acc.email;
              const label = rawLabel
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
              return {
                label,
                sub: acc.email,
                role,
                email: acc.email,
                password: acc.password,
                initial: (label[0] ?? "D").toUpperCase(),
              };
            },
          );
          setDemoAccounts(mapped);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignIn(targetEmail = email, targetPassword = password, targetRole?: string) {
    setError(null);
    setSubmitting(true);
    const result = await signIn(targetEmail, targetPassword);
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    if (targetRole === "authority" || targetEmail.toLowerCase().includes("authority")) {
      router.replace("/authority");
    } else {
      router.replace(safeReturnPath(next));
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
              paddingBottom: Math.max(insets.bottom + 16, 24),
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
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              Sign in to report and confirm hazards.
            </Text>
          </View>

          {/* Google Sign-In */}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text3 }]}>or with email</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Form */}
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
              placeholder="Your password"
              autoCapitalize="none"
              editable={!submitting}
              error={error}
            />

            <View style={styles.forgotRow}>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.push("/auth/forgot-password")}
              >
                <Text style={[styles.forgotLink, { color: colors.accent }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            <Button
              title="Sign in"
              size="L"
              variant="primary"
              loading={submitting}
              onPress={() => void handleSignIn()}
              style={{ marginTop: 4 }}
            />

            <View style={styles.switchAuthRow}>
              <Text style={[styles.switchAuthText, { color: colors.text2 }]}>
                New here?{" "}
              </Text>
              <Pressable hitSlop={8} onPress={() => router.push("/auth/register")}>
                <Text style={[styles.switchAuthLink, { color: colors.accent }]}>
                  Create account
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomStack}>
            {!IS_PRODUCTION ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try a demo account"
                onPress={() => setDemoSheetOpen(true)}
                style={({ pressed }) => [
                  styles.demoRow,
                  {
                    borderColor: colors.text3,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.demoIconTile, { backgroundColor: colors.surface2 }]}>
                  <Icon name="flask-conical" size={16} color={colors.text} />
                </View>
                <View style={styles.demoTextCol}>
                  <Text style={[styles.demoTitle, { color: colors.text }]}>
                    Try a demo account
                  </Text>
                  <Text style={[styles.demoSub, { color: colors.text3 }]}>
                    Test data · no sign-up needed
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.text3} />
              </Pressable>
            ) : null}

            <Button
              title="Continue as guest"
              size="M"
              variant="text"
              onPress={() => router.replace("/")}
              textStyle={{ color: colors.text }}
            />

            <Text style={[styles.legalLine, { color: colors.text3 }]}>
              By continuing you agree to the{" "}
              <Text
                style={{ color: colors.text2, fontWeight: "600", textDecorationLine: "underline" }}
                onPress={() => router.push("/legal")}
              >
                Terms
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Demo Accounts ModalSheet (non-production only) */}
      <ModalSheet visible={demoSheetOpen} onClose={() => setDemoSheetOpen(false)}>
        <View style={styles.demoSheet}>
          <View style={styles.demoSheetHeader}>
            <Text style={[styles.demoSheetTitle, { color: colors.text }]}>
              Demo accounts
            </Text>
            <SimulatedTag label="Test data" />
          </View>

          <ListGroup>
            {demoAccounts.map((acc, idx) => (
              <Pressable
                key={acc.email}
                accessibilityRole="button"
                onPress={() => {
                  setDemoSheetOpen(false);
                  setEmail(acc.email);
                  setPassword(acc.password);
                  void handleSignIn(acc.email, acc.password, acc.role);
                }}
                style={({ pressed }) => [
                  styles.demoAccRow,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  pressed && { backgroundColor: colors.surface2 },
                ]}
              >
                <View style={[styles.demoAvatar, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.demoAvatarText, { color: colors.accent }]}>
                    {acc.initial}
                  </Text>
                </View>
                <View style={styles.demoAccTextCol}>
                  <Text style={[styles.demoAccLabel, { color: colors.text }]}>
                    {acc.label}
                  </Text>
                  <Text style={[styles.demoAccEmail, { color: colors.text3 }]} numberOfLines={1}>
                    {acc.sub}
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.text3} />
              </Pressable>
            ))}
          </ListGroup>
        </View>
      </ModalSheet>

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
    marginTop: 16,
    ...typography.display,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    ...typography.body,
    textAlign: "center",
  },
  googleBtn: {
    marginTop: 24,
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
    marginVertical: 18,
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
  forgotRow: {
    alignItems: "flex-end",
  },
  forgotLink: {
    ...typography.caption,
    fontWeight: "600",
  },
  switchAuthRow: {
    marginTop: 4,
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
  bottomStack: {
    marginTop: "auto",
    paddingTop: 24,
    gap: 8,
  },
  demoRow: {
    height: 56,
    borderRadius: radius.buttonLg,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  demoIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  demoTextCol: {
    flex: 1,
  },
  demoTitle: {
    ...typography.secondary,
    fontWeight: "600",
  },
  demoSub: {
    ...typography.small,
  },
  legalLine: {
    textAlign: "center",
    ...typography.small,
  },
  demoSheet: {
    paddingTop: 8,
    gap: 16,
  },
  demoSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoSheetTitle: {
    ...typography.title,
  },
  demoAccRow: {
    height: 62,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  demoAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  demoAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  demoAccTextCol: {
    flex: 1,
    gap: 2,
  },
  demoAccLabel: {
    ...typography.bodySemibold,
  },
  demoAccEmail: {
    ...typography.small,
  },
});
