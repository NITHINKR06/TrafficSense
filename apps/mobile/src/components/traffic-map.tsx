import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { LiveIncident, RouteOption, TrafficSegment } from "@trafficsense/shared";
import { buildMapHtml, MAP_ATTRIBUTION } from "../map/map-html";
import { buildMapPayload, ROUTE_COLOURS, SEVERITY_COLOURS, INCIDENT_COLOUR, type MapPayload } from "../map/map-data";
import { Button, Card, Icon, SimulatedBadge } from "./ui";
import { SchematicMap } from "./schematic-map";
import { colors, minTouchTarget, radius, space, typography } from "../theme/tokens";

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
  const [fullScreen, setFullScreen] = useState(false);
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

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapFrame}>
        {status === "ready" || status === "fallback" || status === "loading" ? (
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
            accessibilityLabel="Interactive traffic map showing road incidents and corridor segments"
          />
        ) : (
          <SchematicMap
            segments={props.segments}
            routes={props.routes}
            incidents={props.incidents}
            selectedIncidentId={props.selectedIncidentId}
            onSelectIncident={props.onSelectIncident}
          />
        )}
        {status === "loading" ? (
          <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Rendering coastal map tiles…</Text>
          </View>
        ) : null}
      </View>

      {status === "idle" || status === "failed" ? (
        <Card style={styles.gate}>
          <Text style={styles.gateTitle}>{status === "failed" ? "Street map unavailable" : "Schematic map ready"}</Text>
          <Text style={styles.gateBody}>{status === "failed" ? failure ?? FAILURE_MESSAGES.renderer : "Use the schematic map now, or load an optional street map. Loading it contacts OpenFreeMap and jsDelivr; TrafficSense does not send your location."}</Text>
          <Button title={status === "failed" ? "Retry street map" : "Load detailed street map"} onPress={startLoading} variant="outline" />
        </Card>
      ) : null}

      {status === "fallback" ? (
        <View style={styles.fallbackNotice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>
            Street tiles unreachable. Displaying schematic corridor overlay.
          </Text>
        </View>
      ) : null}

      {(status === "ready" || status === "fallback") && (
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fit map to all reports and corridors"
            onPress={sendFit}
            style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
          >
            <Icon name="crop_free" size={16} color={colors.primary} />
            <Text style={styles.toolText}>Fit map</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={you ? "Update my location on map" : "Show my location on map"}
            onPress={() => void centreOnMe()}
            style={({ pressed }) => [styles.toolButton, pressed && styles.toolButtonPressed]}
          >
            <Icon name="my_location" size={16} color={colors.primary} />
            <Text style={styles.toolText}>{you ? "Update location" : "Show my location"}</Text>
          </Pressable>
        </View>
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Open full-screen schematic map" onPress={() => setFullScreen(true)} style={styles.fullScreenButton}>
        <Icon name="fullscreen" size={16} color={colors.primary} />
        <Text style={styles.toolText}>Full screen</Text>
      </Pressable>

      {locationNote ? (
        <Text style={styles.noticeText}>{locationNote}</Text>
      ) : null}

      {/* Map Legend */}
      <View style={styles.legend} accessibilityLabel="Map legend">
        <LegendItem colour={ROUTE_COLOURS.primary} label="Recommended route" />
        <LegendItem colour={ROUTE_COLOURS.alternative} label="Your alternative" />
        <LegendItem colour={INCIDENT_COLOUR} label="Community report" />
        <LegendItem colour={SEVERITY_COLOURS.slowdown} label="Corridor slowdown" />
        <LegendItem colour={SEVERITY_COLOURS.clear} label="Clear flow" />
      </View>

      <View style={styles.attributionRow}>
        <Text style={styles.attribution}>{MAP_ATTRIBUTION}. Corridor lines are schematic and SIMULATED.</Text>
        <SimulatedBadge label="SCHEMATIC" />
      </View>

      <Modal visible={fullScreen} animationType="slide" onRequestClose={() => setFullScreen(false)}>
        <View style={styles.fullScreenModal}>
          <View style={styles.fullScreenHeader}>
            <View><Text style={styles.gateTitle}>Full-screen schematic map</Text><Text style={styles.gateSubtitle}>Reports and routes only; not street navigation.</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen map" onPress={() => setFullScreen(false)} style={styles.closeButton}><Icon name="close" size={22} color={colors.text} /></Pressable>
          </View>
          <SchematicMap segments={props.segments} routes={props.routes} incidents={props.incidents} selectedIncidentId={props.selectedIncidentId} onSelectIncident={props.onSelectIncident} fullScreen />
        </View>
      </Modal>
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
  wrapper: {
    gap: space.xs,
  },
  mapFrame: {
    height: 360,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  failure: {
    flex: 1,
    padding: space.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.errorSurface,
  },
  failureTitle: {
    ...typography.titleSm,
    color: colors.error,
    fontWeight: "700",
  },
  failureText: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: space.xs,
  },
  fallbackNotice: {
    padding: space.xs,
  },
  noticeText: {
    ...typography.bodySm,
    color: colors.warning,
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: "row",
    gap: space.sm,
    flexWrap: "wrap",
    marginTop: space.xs,
  },
  fullScreenButton: { minHeight: minTouchTarget, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: space.md, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  toolButton: {
    minHeight: minTouchTarget,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  toolButtonPressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  toolIcon: {
    fontSize: 16,
  },
  toolText: {
    ...typography.labelLg,
    color: colors.text,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    paddingVertical: space.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
  },
  attributionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.xs,
  },
  attribution: {
    ...typography.codeSm,
    color: colors.textMuted,
    flex: 1,
  },
  gate: {
    padding: space.lg,
    gap: space.md,
  },
  fullScreenModal: { flex: 1, backgroundColor: colors.background, padding: space.md, gap: space.md },
  fullScreenHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  closeButton: { width: minTouchTarget, height: minTouchTarget, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.surfaceContainer },
  gateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  gateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  gateHeaderTextCol: {
    gap: 2,
  },
  gateTitle: {
    ...typography.titleMd,
    color: colors.text,
    fontWeight: "700",
  },
  gateSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  gateBody: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
