import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LiveIncident } from "@trafficsense/shared";
import { fetchActiveIncidents } from "../../src/lib/api";
import { colors, sharedStyles } from "../../src/ui/theme";

function categoryLabel(category: string) {
  return category.replaceAll("_", " ");
}

function formatTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString() : "Unknown time";
}

export default function IncidentDetailScreen() {
  const { incidentId } = useLocalSearchParams<{ incidentId: string }>();
  const [incident, setIncident] = useState<LiveIncident | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const incidents = await fetchActiveIncidents();
      setIncident(incidents.find((current) => current.id === incidentId) ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Traffic service is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [incidentId]);

  return (
    <ScrollView contentContainerStyle={sharedStyles.screen}>
      <Text style={sharedStyles.title}>Incident details</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Loading incident details" color={colors.primary} /> : null}
      {error ? <><Text accessibilityRole="alert" style={sharedStyles.error}>{error}</Text><Pressable onPress={() => void load()} style={sharedStyles.primaryButton}><Text style={sharedStyles.primaryButtonText}>Try again</Text></Pressable></> : null}
      {!loading && !error && !incident ? <Text style={styles.empty}>This report is no longer active. It may have expired or been resolved.</Text> : null}
      {incident ? <View style={styles.card}>
        <Text style={styles.category}>{categoryLabel(incident.category)}</Text>
        <Text style={sharedStyles.simulatedLabel}>{incident.level} · {incident.provenance}</Text>
        <Detail label="Evidence" value={incident.level_reason} />
        <Detail label="Reports" value={`${incident.report_count} report${incident.report_count === 1 ? "" : "s"}`} />
        <Detail label="First reported" value={formatTime(incident.first_reported_at)} />
        <Detail label="Last confirmed" value={formatTime(incident.last_confirmed_at)} />
        <Text style={styles.note}>Reports expire after server-defined inactivity. This evidence label does not prove the reported cause or guarantee a delay.</Text>
      </View> : null}
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { ...sharedStyles.card, gap: 14 },
  category: { color: colors.text, fontSize: 22, fontWeight: "800", textTransform: "capitalize" },
  detail: { gap: 3 },
  detailLabel: { color: colors.secondaryText, fontSize: 13, fontWeight: "700" },
  detailValue: { color: colors.text, fontSize: 16, lineHeight: 23 },
  note: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  empty: { ...sharedStyles.card, color: colors.secondaryText, fontSize: 16, lineHeight: 24 },
});
