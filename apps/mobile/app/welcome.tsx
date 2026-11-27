import * as SecureStore from "expo-secure-store";
import { router, Stack } from "expo-router";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrafficMap } from "../src/components/traffic-map";
import { Button, Icon } from "../src/components/ui";
import { useTheme } from "../src/theme/theme-provider";
import { radius, space, typography } from "../src/theme/tokens";

export const WELCOME_SEEN_KEY = "trafficsense.welcome_seen";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors, shadows } = useTheme();

  const markSeenAndGo = (path: "/" | "/traffic" | "/auth/login") => {
    SecureStore.setItemAsync(WELCOME_SEEN_KEY, "1").catch(() => {});
    if (path === "/auth/login") {
      router.push(path);
    } else {
      router.replace(path);
    }
  };

  // Scale map preview cleanly on shorter Android screens while targeting 420pt on 844pt screens
  const mapCardHeight = Math.min(420, Math.max(240, screenHeight - 410));

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 16),
          paddingBottom: Math.max(insets.bottom + 12, 28),
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("../assets/design-icon.png")}
            style={styles.brandIcon}
            accessibilityLabel="TrafficSense icon"
          />
          <Text style={[styles.brandName, { color: colors.text }]}>TrafficSense</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={() => markSeenAndGo("/auth/login")}
          style={styles.signInBtn}
        >
          <Text style={[styles.signInText, { color: colors.text }]}>Sign in</Text>
        </Pressable>
      </View>

      {/* Map Preview Card */}
      <View
        style={[
          styles.mapCard,
          {
            height: mapCardHeight,
            borderColor: colors.border,
          },
        ]}
      >
        <TrafficMap
          incidents={[]}
          segments={[]}
          selectedIncidentId={null}
          onSelectIncident={() => {}}
          fitKey={1}
          mapHeight={mapCardHeight}
          hideDetailsCard
          hideLegend
          hideAttribution
          hideControls
        />

        {/* Top-left hazard pill */}
        <View
          style={[
            styles.hazardChip,
            { backgroundColor: colors.surface },
            shadows.card,
          ]}
        >
          <View style={[styles.hazardDot, { backgroundColor: colors.warningDot }]} />
          <Text style={[styles.hazardText, { color: colors.text }]}>
            Flooding · Jyothi Circle
          </Text>
        </View>

        {/* Bottom route overlay card */}
        <View
          style={[
            styles.routeCard,
            { backgroundColor: colors.surface },
            shadows.card,
          ]}
        >
          <View style={[styles.routeIconTile, { backgroundColor: colors.accentSoft }]}>
            <Icon name="route" size={18} color={colors.accent} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={[styles.routeTitle, { color: colors.text }]}>
              18 min to Bejai
            </Text>
            <Text style={[styles.routeSub, { color: colors.text3 }]}>
              Avoids 1 report · arrive 10:32
            </Text>
          </View>
        </View>
      </View>

      {/* Title & Copy */}
      <Text style={[styles.title, { color: colors.text }]}>
        {"Know the road\nbefore you go."}
      </Text>
      <Text style={[styles.body, { color: colors.text2 }]}>
        Live reports from Mangaluru commuters. Plan around floods, jams and closures.
      </Text>

      {/* Bottom CTA Stack */}
      <View style={styles.ctaStack}>
        <Button
          title="Plan my route"
          size="L-sheet"
          variant="primary"
          onPress={() => markSeenAndGo("/")}
          trailingIcon={<Icon name="arrow-right" size={18} color={colors.onAccent} strokeWidth={2.2} />}
        />

        <Button
          title="Explore the live map"
          size="M"
          variant="text"
          onPress={() => markSeenAndGo("/traffic")}
          textStyle={{ color: colors.text }}
        />

        <View style={styles.legalRow}>
          <Pressable hitSlop={10} onPress={() => router.push("/legal")}>
            <Text style={[styles.legalLink, { color: colors.text3 }]}>Terms</Text>
          </Pressable>
          <Text style={[styles.legalSep, { color: colors.text3 }]}> · </Text>
          <Pressable hitSlop={10} onPress={() => router.push("/legal")}>
            <Text style={[styles.legalLink, { color: colors.text3 }]}>Privacy</Text>
          </Pressable>
          <Text style={[styles.legalSep, { color: colors.text3 }]}> · </Text>
          <Pressable hitSlop={10} onPress={() => router.push("/legal")}>
            <Text style={[styles.legalLink, { color: colors.text3 }]}>Licenses</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: space.gutter,
  },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.16,
  },
  signInBtn: {
    height: 44,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  signInText: {
    ...typography.bodySemibold,
  },
  mapCard: {
    marginTop: 12,
    borderRadius: radius.modalSheet,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  hazardChip: {
    position: "absolute",
    top: 16,
    left: 16,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hazardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hazardText: {
    ...typography.caption,
    fontWeight: "600",
  },
  routeCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    height: 64,
    borderRadius: radius.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  routeIconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.iconTile,
    alignItems: "center",
    justifyContent: "center",
  },
  routeTextCol: {
    flex: 1,
    gap: 1,
  },
  routeTitle: {
    ...typography.bodySemibold,
    fontVariant: ["tabular-nums"],
  },
  routeSub: {
    ...typography.small,
    fontVariant: ["tabular-nums"],
  },
  title: {
    marginTop: 24,
    ...typography.welcomeDisplay,
  },
  body: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
  },
  ctaStack: {
    marginTop: "auto",
    gap: 6,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  legalLink: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalSep: {
    fontSize: 12,
  },
});
