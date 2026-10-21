import { router, Stack } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/providers/auth-provider";
import { Button, Card, SimulatedBadge } from "../src/components/ui";
import { colors, radius, space, typography } from "../src/theme/tokens";

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Status & Civic Eyebrow */}
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live · Coastal transit advisory</Text>
            </View>
            <SimulatedBadge label="SIMULATED DATA" />
          </View>
          <Text style={styles.eyebrow}>TrafficSense · Mangaluru</Text>
          <Text style={styles.title}>Report road problems and plan around them.</Text>
          <Text style={styles.subtitle}>
            Civic transit updates for coastal Karnataka. Check routes with clear provenance and community-verified reports.
          </Text>
        </View>

        {/* Hero Card: Route Planner Preview */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroIcon}>🧭</Text>
              <View>
                <Text style={styles.heroTitle}>Plan my route</Text>
                <Text style={styles.heroSubtitle}>Mangaluru Central Corridor & Bypasses</Text>
              </View>
            </View>
            <SimulatedBadge label="CORRIDOR MODEL" />
          </View>

          {/* Preset Corridor Route Preview Strip */}
          <View style={styles.routeSchematic}>
            <View style={styles.routeNode}>
              <View style={[styles.nodeDot, styles.startDot]} />
              <View style={styles.nodeTextCol}>
                <Text style={styles.nodeLabel}>ORIGIN</Text>
                <Text style={styles.nodePlace}>State Bank / Ladyhill</Text>
              </View>
            </View>
            <View style={styles.routeConnector}>
              <View style={styles.routeLine} />
              <Text style={styles.routeBadgeText}>Estimated free-flow</Text>
            </View>
            <View style={styles.routeNode}>
              <View style={[styles.nodeDot, styles.endDot]} />
              <View style={styles.nodeTextCol}>
                <Text style={styles.nodeLabel}>DESTINATION</Text>
                <Text style={styles.nodePlace}>Pumpwell Circle / Kankanady</Text>
              </View>
            </View>
          </View>

          <Button
            title="Inspect Coastal Routes · ~18 min"
            onPress={() => router.push("/planner")}
            variant="primary"
          />
        </Card>

        {/* 2x2 Quick Action Grid */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionHeading}>Commuter Services</Text>
          <View style={styles.grid}>
            {/* Action 1: Report Issue */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Report issue: Waterlog, pot, jam"
              onPress={() => router.push("/report")}
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconContainer, styles.hazardIconBg]}>
                  <Text style={styles.tileIcon}>⚠️</Text>
                </View>
                <Text style={styles.tilePill}>1-tap</Text>
              </View>
              <View style={styles.tileContent}>
                <Text style={styles.tileTitle}>Report issue</Text>
                <Text style={styles.tileSubtitle}>Waterlog, pothole, jam</Text>
              </View>
            </Pressable>

            {/* Action 2: Live Map */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Live map: Pan-city sensors"
              onPress={() => router.push("/traffic")}
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconContainer, styles.mapIconBg]}>
                  <Text style={styles.tileIcon}>🗺️</Text>
                </View>
                <Text style={[styles.tilePill, styles.livePill]}>Live</Text>
              </View>
              <View style={styles.tileContent}>
                <Text style={styles.tileTitle}>Live map</Text>
                <Text style={styles.tileSubtitle}>Pan-city reports</Text>
              </View>
            </Pressable>

            {/* Action 3: Plan Route */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Plan route: Monsoon detours"
              onPress={() => router.push("/planner")}
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconContainer, styles.routeIconBg]}>
                  <Text style={styles.tileIcon}>🛣️</Text>
                </View>
                <Text style={styles.tilePill}>Route</Text>
              </View>
              <View style={styles.tileContent}>
                <Text style={styles.tileTitle}>Plan route</Text>
                <Text style={styles.tileSubtitle}>Monsoon detours</Text>
              </View>
            </Pressable>

            {/* Action 4: My Journeys */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="My journeys: Saved daily routes and employer sharing"
              onPress={() => router.push("/journeys")}
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconContainer, styles.journeysIconBg]}>
                  <Text style={styles.tileIcon}>🛡️</Text>
                </View>
                <Text style={[styles.tilePill, styles.savedPill]}>Sharing</Text>
              </View>
              <View style={styles.tileContent}>
                <Text style={styles.tileTitle}>My journeys</Text>
                <Text style={styles.tileSubtitle}>Consent sharing</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Account & Workspace Card */}
        <Card style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountRole}>
                {session ? "COMMUTER WORKSPACE" : "COMMUTER ACCOUNT"}
              </Text>
              <Text style={styles.accountName}>
                {session ? (session.user.email ?? "Authenticated user") : "Guest commuter"}
              </Text>
              <Text style={styles.accountDescription}>
                {session
                  ? "Manage active journeys, employer consent sharing, and submitted reports."
                  : "Sign in with a verified account to submit reports and share journey corridors."}
              </Text>
            </View>
          </View>
          <Button
            title={session ? "Open workspace →" : "Sign in / Register"}
            onPress={() => router.push(session ? "/workspace" : "/auth/login")}
            variant={session ? "outline" : "secondary"}
          />
        </Card>

        {/* Civic Disclosure Notes */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Civic Data Transparency</Text>
          <Text style={styles.disclaimerText}>
            • Location is requested only when you choose to submit a report.
          </Text>
          <Text style={styles.disclaimerText}>
            • Traffic information is community-reported and estimated, not live speed tracking.
          </Text>
          <Text style={styles.disclaimerText}>
            • Corridor segments and delays are schematic demonstration data.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.gutter,
    paddingTop: space.xl + space.md,
    paddingBottom: space.xl * 2,
    gap: space.md,
    backgroundColor: colors.background,
  },
  header: {
    gap: space.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.xs,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  eyebrow: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    ...typography.headlineLg,
    color: colors.text,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  heroCard: {
    padding: space.md,
    gap: space.md,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  heroIcon: {
    fontSize: 22,
  },
  heroTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  heroSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  routeSchematic: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.md,
    gap: space.sm,
  },
  routeNode: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  startDot: {
    backgroundColor: colors.primary,
  },
  endDot: {
    backgroundColor: colors.evidence,
  },
  nodeTextCol: {
    flex: 1,
  },
  nodeLabel: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  nodePlace: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "600",
  },
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 5,
    gap: space.sm,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.outlineVariant,
  },
  routeBadgeText: {
    ...typography.codeSm,
    color: colors.textMuted,
  },
  gridSection: {
    gap: space.sm,
  },
  sectionHeading: {
    ...typography.titleSm,
    color: colors.text,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  actionTile: {
    flex: 1,
    minWidth: "47%",
    minHeight: 104,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    justifyContent: "space-between",
  },
  pressedTile: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  hazardIconBg: {
    backgroundColor: colors.errorSurface,
  },
  mapIconBg: {
    backgroundColor: colors.primaryFixed,
  },
  routeIconBg: {
    backgroundColor: colors.evidenceSurface,
  },
  journeysIconBg: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  tileIcon: {
    fontSize: 18,
  },
  tilePill: {
    ...typography.codeSm,
    color: colors.textMuted,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  livePill: {
    color: colors.primary,
    backgroundColor: colors.primaryFixed,
    fontWeight: "700",
  },
  savedPill: {
    color: colors.evidence,
    backgroundColor: colors.evidenceSurface,
    fontWeight: "700",
  },
  tileContent: {
    gap: 2,
  },
  tileTitle: {
    ...typography.labelLg,
    color: colors.text,
    fontWeight: "700",
  },
  tileSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  accountCard: {
    padding: space.md,
    gap: space.sm,
  },
  accountRow: {
    gap: space.xs,
  },
  accountInfo: {
    gap: 4,
  },
  accountRole: {
    ...typography.codeSm,
    color: colors.evidence,
    fontWeight: "700",
  },
  accountName: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  accountDescription: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  disclaimerBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.control,
    padding: space.md,
    gap: 6,
    marginTop: space.xs,
  },
  disclaimerTitle: {
    ...typography.labelSm,
    color: colors.text,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
