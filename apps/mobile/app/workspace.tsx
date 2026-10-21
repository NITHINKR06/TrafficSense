import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { Button, Card, FeedbackBox } from "../src/components/ui";
import { colors, space, typography } from "../src/theme/tokens";

export default function WorkspaceScreen() {
  const { session, loading, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Private screen: unauthenticated visitors are sent to sign-in without seeing account data.
  useEffect(() => {
    if (!loading && !session) router.replace("/auth/login");
  }, [loading, session]);

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: "Workspace" }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  async function leave() {
    setError(null);
    setLeaving(true);
    const result = await signOut();
    setLeaving(false);
    if (result) {
      setError(result);
      return;
    }
    // replace() clears private screens from the stack after sign-out.
    router.replace("/");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Commuter Workspace" }} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AUTHENTICATED COMMUTER</Text>
          <Text style={styles.title}>Your Workspace</Text>
          <Text style={styles.subtitle}>
            Signed in as <Text style={styles.boldEmail}>{session.user.email ?? "Commuter"}</Text>.
          </Text>
        </View>

        {/* Account Details Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(session.user.email?.[0] ?? "C").toUpperCase()}
              </Text>
            </View>
            <View style={styles.accountTextGroup}>
              <Text style={styles.accountEmail}>{session.user.email}</Text>
              <Text style={styles.accountRoleBadge}>Verified Commuter Account</Text>
            </View>
          </View>
          <Text style={styles.accountNote}>
            Your reports contribute directly to community verification levels (L1–L6). Your journey corridor updates can be selectively shared with employer organisations.
          </Text>
        </Card>

        {/* Quick Navigation Cards */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionHeading}>Commuter Actions</Text>
          <Card
            onPress={() => router.push("/report")}
            style={styles.actionCard}
          >
            <View style={styles.actionRow}>
              <View style={[styles.actionIconBg, { backgroundColor: colors.errorSurface }]}>
                <Text style={styles.actionIcon}>⚠️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Report road obstacle</Text>
                <Text style={styles.actionSubtitle}>Waterlogging, potholes, breakdown, closures</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </View>
          </Card>

          <Card
            onPress={() => router.push("/planner")}
            style={styles.actionCard}
          >
            <View style={styles.actionRow}>
              <View style={[styles.actionIconBg, { backgroundColor: colors.evidenceSurface }]}>
                <Text style={styles.actionIcon}>🛣️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Plan my route</Text>
                <Text style={styles.actionSubtitle}>Inspect presets, free-flow estimates & alternatives</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </View>
          </Card>

          <Card
            onPress={() => router.push("/traffic")}
            style={styles.actionCard}
          >
            <View style={styles.actionRow}>
              <View style={[styles.actionIconBg, { backgroundColor: colors.primaryFixed }]}>
                <Text style={styles.actionIcon}>🗺️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Live community traffic map</Text>
                <Text style={styles.actionSubtitle}>View real-time reports and corridor statuses</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </View>
          </Card>

          <Card
            onPress={() => router.push("/journeys")}
            style={styles.actionCard}
          >
            <View style={styles.actionRow}>
              <View style={[styles.actionIconBg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={styles.actionIcon}>🛡️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>My journeys & employer sharing</Text>
                <Text style={styles.actionSubtitle}>Manage active journeys and consent permissions</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </View>
          </Card>
        </View>

        {error ? (
          <FeedbackBox
            variant="error"
            message={error}
            actionText="Dismiss"
            onAction={() => setError(null)}
          />
        ) : null}

        {/* Sign Out Action */}
        <Button
          title={leaving ? "Signing out…" : "Sign out"}
          disabled={leaving}
          loading={leaving}
          onPress={() => void leave()}
          variant="outline"
          style={styles.signOutButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    padding: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.xl * 2,
    gap: space.md,
    backgroundColor: colors.background,
  },
  header: {
    gap: space.xs,
  },
  eyebrow: {
    ...typography.codeSm,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    ...typography.headlineLg,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  boldEmail: {
    fontWeight: "700",
    color: colors.text,
  },
  card: {
    padding: space.md,
    gap: space.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.titleMd,
    color: colors.onPrimary,
    fontWeight: "700",
  },
  accountTextGroup: {
    flex: 1,
    gap: 2,
  },
  accountEmail: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  accountRoleBadge: {
    ...typography.codeSm,
    color: colors.evidence,
    fontWeight: "600",
  },
  accountNote: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionsSection: {
    gap: space.sm,
  },
  sectionHeading: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  actionCard: {
    padding: space.md,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextCol: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    ...typography.labelLg,
    color: colors.text,
    fontWeight: "700",
  },
  actionSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "700",
  },
  signOutButton: {
    marginTop: space.sm,
  },
});
