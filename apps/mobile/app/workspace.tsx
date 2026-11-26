import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  BottomNav,
  Button,
  Icon,
  ListGroup,
  ListRow,
  ModalSheet,
  Radio,
} from "../src/components/ui";
import { useTabBackHandler } from "../src/lib/use-tab-back-handler";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { size as sizes, space, typography, type ThemeMode } from "../src/theme/tokens";

const APPEARANCE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function WorkspaceScreen() {
  useTabBackHandler();
  const insets = useSafeAreaInsets();
  const { session, loading, signOut, role } = useAuth();
  const { colors, mode, setMode } = useTheme();

  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const isAuthority =
    role === "authority" ||
    Boolean(session?.user?.email?.toLowerCase().includes("authority"));

  useEffect(() => {
    if (!loading && !session) router.replace("/auth/login");
  }, [loading, session]);

  if (loading || !session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const email = session.user.email ?? "commuter@trafficsense.app";
  const initial = (email[0] ?? "C").toUpperCase();
  const appearanceLabel =
    mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System";

  async function handleSignOut() {
    setError(null);
    setLeaving(true);
    const result = await signOut();
    setLeaving(false);
    if (result) {
      setError(result);
      return;
    }
    router.replace("/");
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom: sizes.scrollBottomClearance + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Me</Text>

        {/* Profile Row */}
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{initial}</Text>
          </View>
          <View style={styles.profileTextCol}>
            <Text style={[styles.profileEmail, { color: colors.text }]} numberOfLines={1}>
              {email}
            </Text>
            <View style={styles.verifiedRow}>
              <Icon name="shield-check" size={14} color={colors.accent} strokeWidth={2.2} />
              <Text style={[styles.verifiedText, { color: colors.accent }]}>
                {isAuthority ? "Municipal authority" : "Verified commuter"}
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <Banner
            variant="danger"
            icon="circle-alert"
            title={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        {/* Activity */}
        <ListGroup title="Activity">
          {isAuthority ? (
            <ListRow
              first
              icon="shield-check"
              label="Control room"
              meta="Ops"
              onPress={() => router.push("/authority")}
            />
          ) : null}
          <ListRow
            first={!isAuthority}
            icon="clock"
            label="Journeys"
            meta="Beta"
            onPress={() => router.push("/journeys")}
          />
        </ListGroup>

        {/* Settings */}
        <ListGroup title="Settings">
          <ListRow
            first
            icon="moon"
            label="Appearance"
            meta={appearanceLabel}
            onPress={() => setAppearanceOpen(true)}
          />
          <ListRow
            icon="navigation"
            label="Location"
            meta="When reporting"
            onPress={() => router.push("/legal")}
          />
        </ListGroup>

        {/* About */}
        <ListGroup title="About">
          <ListRow
            first
            icon="shield"
            label="Privacy policy"
            onPress={() => router.push("/legal")}
          />
          <ListRow
            icon="file-text"
            label="Terms of use"
            onPress={() => router.push("/legal")}
          />
          <ListRow
            icon="list"
            label="Open-source licenses"
            onPress={() => router.push("/legal")}
          />
          <ListRow
            icon="map"
            label="Map data"
            meta="OpenStreetMap"
            onPress={() => router.push("/legal")}
          />
        </ListGroup>

        <Button
          title="Sign out"
          size="L"
          variant="signout"
          loading={leaving}
          onPress={() => void handleSignOut()}
          icon={<Icon name="log-out" size={18} color={colors.danger} />}
        />
      </ScrollView>

      {/* Appearance Picker Sheet */}
      <ModalSheet visible={appearanceOpen} onClose={() => setAppearanceOpen(false)}>
        <View style={styles.appearanceSheet}>
          <Text style={[styles.appearanceTitle, { color: colors.text }]}>
            Appearance
          </Text>
          <ListGroup>
            {APPEARANCE_OPTIONS.map((opt, idx) => {
              const selected = mode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setMode(opt.value);
                    setAppearanceOpen(false);
                  }}
                  style={[
                    styles.appearanceRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.appearanceLabel, { color: colors.text }]}>
                    {opt.label}
                  </Text>
                  <Radio selected={selected} />
                </Pressable>
              );
            })}
          </ListGroup>
        </View>
      </ModalSheet>

      <BottomNav activeTab="me" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    gap: 24,
  },
  title: {
    ...typography.display,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
  },
  profileTextCol: {
    flex: 1,
    gap: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedText: {
    ...typography.caption,
  },
  appearanceSheet: {
    paddingTop: 8,
    gap: 16,
  },
  appearanceTitle: {
    ...typography.title,
  },
  appearanceRow: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appearanceLabel: {
    ...typography.bodyMedium,
  },
});
