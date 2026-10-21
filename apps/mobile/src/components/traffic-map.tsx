import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { LiveIncident, RouteOption, TrafficSegment } from "@trafficsense/shared";
import { buildMapHtml, MAP_ATTRIBUTION } from "../map/map-html";
import { buildMapPayload, ROUTE_COLOURS, SEVERITY_COLOURS, INCIDENT_COLOUR, type MapPayload } from "../map/map-data";
import { colors, minTouchTarget, radius, space } from "../theme/tokens";

export type MapStatus = "idle" | "loading" | "ready" | "fallback" | "failed";

const LOAD_TIMEOUT_MS = 25_000;

const FAILURE_MESSAGES: Record<string, string> = {
  webgl: "This phone cannot display maps (graphics support is unavailable). The list still works.",
  library: "The map library could not load. Check your connection and try again.",
  renderer: "The map could not start on this phone. The list still works.",
  timeout: "The map took too long to load. Check your connection and try again.",
  network: "The map could not reach its tile service. Check your connection and try again.",
};

type Props = {
  segments: TrafficSegment[];
  incidents: LiveIncident[];
  routes?: RouteOption[];
  alternativeId?: string | null;
  selectedIncidentId: string | null;
  selectedRouteId?: string | null;
  onSelectIncident: (id: string) => void;
  onSelectRoute?: (id: string) => void;
  // Increment to refit the view to the data (for example after a refresh or a new route).
  fitKey: number;
};

export function TrafficMap(props: Props) {
  const [status, setStatus] = useState<MapStatus>("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [you, setYou] = useState<[number, number] | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const webRef = useRef<WebView>(null);
  const latestPayload = useRef<MapPayload | null>(null);
  const sentFitKey = useRef<number | null>(null);

  const html = useMemo(() => buildMapHtml(), []);


  // Fail safely if the page never reports ready (for example when the network is blocked).
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => {
      setFailure(FAILURE_MESSAGES.timeout);
      setStatus("failed");
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, attempt]);

  // Send data whenever the displayed data or selection changes; the page queues it until ready.
  useEffect(() => {
    const fit = sentFitKey.current !== props.fitKey;
    sentFitKey.current = props.fitKey;
    const payload = buildMapPayload({
      segments: props.segments,
      incidents: props.incidents,
      routes: props.routes,
      selectedIncidentId: props.selectedIncidentId,
      selectedRouteId: props.selectedRouteId,
      alternativeId: props.alternativeId,
      you,
      fit,
    });
    latestPayload.current = payload;
    sendPayload(payload);
    // Only data, selection and fit requests should resend the map payload.
  }, [props.segments, props.incidents, props.routes, props.alternativeId, props.selectedIncidentId, props.selectedRouteId, props.fitKey, you]);

  function sendPayload(payload: MapPayload) {
    webRef.current?.injectJavaScript(
      `window.trafficMap && window.trafficMap.setData(${JSON.stringify(payload)}); true;`,
    );
  }

  function handleMessage(event: WebViewMessageEvent) {
    let message: { type?: string; id?: string; reason?: string; fallback?: boolean };
    try {
      message = JSON.parse(event.nativeEvent.data) as typeof message;
    } catch {
      return;
    }
    if (message.type === "ready") {
      setStatus(message.fallback ? "fallback" : "ready");
      setFailure(null);
      if (latestPayload.current) sendPayload(latestPayload.current);
    } else if (message.type === "failed") {
      setFailure(FAILURE_MESSAGES[message.reason ?? "renderer"] ?? FAILURE_MESSAGES.renderer);
      setStatus("failed");
    } else if (message.type === "select-incident" && typeof message.id === "string") {
      props.onSelectIncident(message.id);
    } else if (message.type === "select-route" && typeof message.id === "string") {
      props.onSelectRoute?.(message.id);
    }
  }

  function sendFit() {
    webRef.current?.injectJavaScript("window.trafficMap && window.trafficMap.refit(); true;");
  }

  function startLoading() {
    setFailure(null);
    setStatus("loading");
    setAttempt((value) => value + 1);
  }

  async function centreOnMe() {
    setLocationNote(null);
    // Location is requested only after this explicit tap, stays on the phone, and is never sent to the server.
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setLocationNote("Location permission is off. The map still works without it.");
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setYou([position.coords.longitude, position.coords.latitude]);
    } catch {
      setLocationNote("Your location could not be read right now.");
    }
  }

  if (status === "idle") {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>Load the street map</Text>
        <Text style={styles.gateBody}>
          Loading the map contacts OpenFreeMap for street tiles and jsDelivr for the map library. Those services receive your
          IP address and the map areas you view. TrafficSense does not send your location to them, and the list stays available without the map.
        </Text>
        <Pressable accessibilityRole="button" onPress={startLoading} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Load map</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapFrame}>
        {status === "failed" ? (
          <View style={styles.failure} accessibilityLiveRegion="polite">
            <Text style={styles.failureText}>{failure ?? FAILURE_MESSAGES.renderer}</Text>
            <Pressable accessibilityRole="button" onPress={startLoading} style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>Retry map</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            key={attempt}
            ref={webRef}
            style={styles.webview}
            source={{ html }}
            originWhitelist={["about:*", "data:*", "https://*"]}
            javaScriptEnabled
            domStorageEnabled={false}
            setSupportMultipleWindows={false}
            onMessage={handleMessage}
            onError={() => {
              setFailure(FAILURE_MESSAGES.network);
              setStatus("failed");
            }}
            // Only the initial page may load; taps on the map never navigate the app to other sites.
            onShouldStartLoadWithRequest={(request) => request.url.startsWith("about:") || request.url.startsWith("data:")}
            accessibilityLabel="Traffic map"
          />
        )}
        {status === "loading" ? (
          <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading map…</Text>
          </View>
        ) : null}
      </View>

      {status === "fallback" ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          Street map unavailable. Showing the schematic corridor only.
        </Text>
      ) : null}

      {status === "ready" || status === "fallback" ? (
        <View style={styles.toolbar}>
          <Pressable accessibilityRole="button" onPress={sendFit} style={styles.toolButton}>
            <Text style={styles.toolText}>Fit map</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void centreOnMe()} style={styles.toolButton}>
            <Text style={styles.toolText}>{you ? "Update my location" : "Show my location"}</Text>
          </Pressable>
        </View>
      ) : null}
      {locationNote ? <Text style={styles.notice}>{locationNote}</Text> : null}

      <View style={styles.legend} accessibilityLabel="Map legend">
        <LegendItem colour={ROUTE_COLOURS.primary} label="Recommended route" />
        <LegendItem colour={ROUTE_COLOURS.alternative} label="Your alternative" />
        <LegendItem colour={INCIDENT_COLOUR} label="Community report" />
        <LegendItem colour={SEVERITY_COLOURS.slowdown} label="Segment: slowdown" />
        <LegendItem colour={SEVERITY_COLOURS.clear} label="Segment: clear" />
      </View>
      <Text style={styles.attribution}>{MAP_ATTRIBUTION}. Corridor lines are schematic and SIMULATED.</Text>
    </View>
  );
}

function LegendItem({ colour, label }: { colour: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: colour }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs },
  mapFrame: { height: 360, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  webview: { flex: 1, backgroundColor: colors.background },
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: space.xs, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  failure: { flex: 1, padding: space.md, justifyContent: "center", gap: space.sm, backgroundColor: colors.errorSurface },
  failureText: { color: colors.error, fontSize: 14, lineHeight: 20 },
  notice: { color: colors.warning, fontSize: 13, lineHeight: 19 },
  toolbar: { flexDirection: "row", gap: space.xs, flexWrap: "wrap" },
  toolButton: { minHeight: minTouchTarget, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.secondaryBorder, backgroundColor: colors.surface },
  toolText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: colors.textSecondary, fontSize: 12 },
  attribution: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  gate: { padding: space.md, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: space.sm },
  gateTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  gateBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  primary: { minHeight: minTouchTarget + 4, justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.primary },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  inlineAction: { alignSelf: "flex-start", minHeight: minTouchTarget, justifyContent: "center" },
  inlineActionText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
