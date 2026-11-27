import { router, Stack } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Icon,
  IconButton,
  ListGroup,
  ListRow,
  Toast,
} from "../src/components/ui";
import { useTheme } from "../src/theme/theme-provider";
import { radius, space, typography } from "../src/theme/tokens";
import { useState } from "react";

const PROMISES = [
  {
    icon: "navigation" as const,
    text: "Location is used only when you send a report",
  },
  {
    icon: "camera" as const,
    text: "Location data is removed from photos",
  },
  {
    icon: "lock" as const,
    text: "Reports keep no personal trail",
  },
];

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 8, 16),
            paddingBottom: Math.max(insets.bottom + 16, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
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
          <Text style={[styles.title, { color: colors.text }]}>Privacy &amp; legal</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>
            How TrafficSense handles your data.
          </Text>
        </View>

        {/* Three Promises Card */}
        <View style={[styles.promisesCard, { backgroundColor: colors.accentSoft }]}>
          {PROMISES.map((item) => (
            <View key={item.text} style={styles.promiseRow}>
              <View style={[styles.promiseIconTile, { backgroundColor: colors.surface }]}>
                <Icon name={item.icon} size={16} color={colors.accent} strokeWidth={2.2} />
              </View>
              <Text style={[styles.promiseText, { color: colors.text }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Legal Docs List */}
        <ListGroup>
          <ListRow
            first
            icon="shield"
            label="Privacy policy"
            sublabel="What we collect and why"
            onPress={() => setToastMsg("Location is requested only on report submission")}
          />
          <ListRow
            icon="file-text"
            label="Terms of use"
            sublabel="Rules for reports and accounts"
            onPress={() => setToastMsg("Community reports are for civic awareness")}
          />
          <ListRow
            icon="list"
            label="Open-source licenses"
            sublabel="Software this app is built on"
            onPress={() => setToastMsg("Expo, React Native, Leaflet, Lucide")}
          />
          <ListRow
            icon="map"
            label="Map data"
            sublabel="© OpenStreetMap contributors · ODbL"
            trailing={<Icon name="external-link" size={16} color={colors.text3} />}
            onPress={() => void Linking.openURL("https://www.openstreetmap.org/copyright")}
          />
          <ListRow
            icon="mail"
            label="Your data"
            sublabel="Ask for a copy or deletion"
            onPress={() => setToastMsg("Contact support via your account settings")}
          />
        </ListGroup>

        <Text style={[styles.versionFooter, { color: colors.text3 }]}>
          TrafficSense · Version 0.1.0
        </Text>
      </ScrollView>

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
    paddingHorizontal: space.gutter,
  },
  header: {
    marginTop: 12,
  },
  title: {
    ...typography.display,
  },
  subtitle: {
    marginTop: 6,
    ...typography.body,
  },
  promisesCard: {
    marginTop: 24,
    borderRadius: radius.cardLg,
    padding: 18,
    gap: 14,
  },
  promiseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  promiseIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  promiseText: {
    flex: 1,
    ...typography.secondary,
    fontWeight: "500",
  },
  versionFooter: {
    marginTop: "auto",
    paddingTop: 24,
    textAlign: "center",
    ...typography.small,
  },
});
