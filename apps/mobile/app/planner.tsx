import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RouteOption } from "@trafficsense/shared";
import { apiConfigurationError, fetchRoute } from "../src/lib/api";
import { mangaluruPlaces } from "../src/lib/places";
import { summarizeRoutes } from "../src/lib/route-alerts";
import { categoryLabel, formatDistance, formatEstimatedDuration } from "../src/lib/format";
import { colors, minTouchTarget, radius, space } from "../src/theme/tokens";

type PlanState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; routes: RouteOption[] };

function PlaceChoices({
  label,
  selected,
  onSelect,
  disabledIndex,
}: {
  label: string;
  selected: number;
  onSelect: (index: number) => void;
  disabledIndex: number;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {mangaluruPlaces.map((place, index) => {
          const isSelected = index === selected;
          const isDisabled = index === disabledIndex;
          return (
            <Pressable
              key={place.name}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onSelect(index)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                isDisabled && styles.chipDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{place.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function PlannerScreen() {
  const [startIndex, setStartIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [plan, setPlan] = useState<PlanState>({ kind: "idle" });
  const [alternativeChosen, setAlternativeChosen] = useState(false);

  async function checkRoute() {
    setAlternativeChosen(false);
    setPlan({ kind: "loading" });
    try {
      const routes = await fetchRoute(mangaluruPlaces[startIndex].coords, mangaluruPlaces[destIndex].coords);
      setPlan({ kind: "result", routes });
    } catch (reason) {
      setPlan({ kind: "error", message: reason instanceof Error ? reason.message : "Route service is unavailable." });
    }
  }

  const summary = plan.kind === "result" ? summarizeRoutes(plan.routes) : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Plan route" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Plan my route</Text>
        <Text style={styles.body}>
          Pick a start and destination. Durations are free-flow estimates; the app does not measure delay for this route.
        </Text>

        {apiConfigurationError ? <Text style={styles.error}>{apiConfigurationError}</Text> : null}

        <PlaceChoices label="From" selected={startIndex} disabledIndex={destIndex} onSelect={setStartIndex} />
        <PlaceChoices label="To" selected={destIndex} disabledIndex={startIndex} onSelect={setDestIndex} />

        <Pressable
          accessibilityRole="button"
          disabled={Boolean(apiConfigurationError) || plan.kind === "loading"}
          onPress={() => void checkRoute()}
          style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
        >
          <Text style={styles.primaryText}>Check route</Text>
        </Pressable>

        {plan.kind === "loading" ? <ActivityIndicator color={colors.primary} style={styles.status} /> : null}

        {plan.kind === "error" ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Text style={styles.error}>{plan.message}</Text>
            <Pressable accessibilityRole="button" onPress={() => void checkRoute()} style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {plan.kind === "result" && summary?.kind === "none" ? (
          <View style={styles.clearBox} accessibilityLiveRegion="polite">
            <Text style={styles.clearTitle}>No active reports affect this route.</Text>
            <Text style={styles.note}>This only reflects community reports the server holds. It is not live traffic.</Text>
          </View>
        ) : null}

        {plan.kind === "result" && summary?.kind === "warning" ? (
          <View style={styles.warningBox} accessibilityLiveRegion="polite">
            <Text style={styles.warningTitle}>Active reports on the recommended route</Text>
            {summary.incidents.map((incident) => (
              <View key={incident.id} style={styles.incidentRow}>
                <Text style={styles.incidentTitle}>{categoryLabel(incident.category)} · {incident.level}</Text>
                <Text style={styles.note}>{incident.label}. About {formatDistance(incident.distance_to_route_m)} from the route.</Text>
              </View>
            ))}

            {summary.alternative && !alternativeChosen ? (
              <Pressable accessibilityRole="button" onPress={() => setAlternativeChosen(true)} style={styles.secondary}>
                <Text style={styles.secondaryText}>Show alternative route</Text>
              </Pressable>
            ) : null}
            {!summary.alternative ? (
              <Text style={styles.note}>No listed alternative avoids these reports. Allow extra time and check again later.</Text>
            ) : null}
          </View>
        ) : null}

        {plan.kind === "result" && summary?.kind === "warning" && summary.alternative && alternativeChosen ? (
          <RouteCard route={summary.alternative} heading="Alternative you chose" />
        ) : null}

        {plan.kind === "result" && summary?.primary ? (
          <RouteCard route={summary.primary} heading="Recommended route" />
        ) : null}
      </ScrollView>
    </>
  );
}

function RouteCard({ route, heading }: { route: RouteOption; heading: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{heading}</Text>
      <Text style={styles.routeName}>{route.name}</Text>
      <Text style={styles.meta}>
        {formatDistance(route.distance_m)} · {formatEstimatedDuration(route.duration_s)} free-flow estimate
      </Text>
      <Text style={styles.note}>Estimated from road distance and speed, not measured traffic. Delay savings are not shown.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.md, padding: space.lg, paddingBottom: space.lg * 2, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24 },
  block: { gap: space.xs },
  label: { color: colors.text, fontSize: 15, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  chip: { minHeight: minTouchTarget, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipDisabled: { opacity: 0.4 },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextSelected: { color: colors.onPrimary, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  primary: { minHeight: minTouchTarget + 8, justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  status: { marginTop: space.xs },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  errorBox: { padding: space.md, borderRadius: radius.control, backgroundColor: colors.errorSurface, gap: space.xs },
  inlineAction: { alignSelf: "flex-start", minHeight: minTouchTarget, justifyContent: "center" },
  inlineActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  clearBox: { padding: space.md, borderRadius: radius.control, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: space.xs },
  clearTitle: { color: colors.success, fontSize: 15, fontWeight: "700" },
  warningBox: { padding: space.md, borderRadius: radius.control, backgroundColor: colors.warningSurface, gap: space.sm },
  warningTitle: { color: colors.warning, fontSize: 15, fontWeight: "800" },
  incidentRow: { gap: 4 },
  incidentTitle: { color: colors.text, fontSize: 15, fontWeight: "700", textTransform: "capitalize" },
  secondary: { minHeight: minTouchTarget, justifyContent: "center", borderRadius: radius.control, borderWidth: 1, borderColor: colors.secondaryBorder, backgroundColor: colors.surface, paddingHorizontal: space.md },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  card: { padding: space.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  eyebrow: { color: colors.evidence, fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  routeName: { color: colors.text, fontSize: 18, fontWeight: "700" },
  meta: { color: colors.textSecondary, fontSize: 15 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
