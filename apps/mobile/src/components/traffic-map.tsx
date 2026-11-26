import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { LiveIncident, RouteOption, TrafficSegment } from "@trafficsense/shared";
import { buildMapPayload, type MapPayload } from "../map/map-data";
import { buildMapHtml } from "../map/map-html";
import { useTheme } from "../theme/theme-provider";
import { Icon } from "./ui";
import { SchematicMap } from "./schematic-map";

type Props = {
  segments: TrafficSegment[];
  incidents: LiveIncident[];
  routes?: RouteOption[];
  alternativeId?: string | null;
  selectedIncidentId: string | null;
  selectedRouteId?: string | null;
  onSelectIncident: (id: string) => void;
  onSelectRoute?: (id: string) => void;
  fitKey: number;
  fullScreen?: boolean;
  hideDetailsCard?: boolean;
  hideLegend?: boolean;
  hideAttribution?: boolean;
  hideControls?: boolean;
  showOnlyLocate?: boolean;
  mapHeight?: number;
  controlsBottomOffset?: number;
  attributionBottomOffset?: number;
};

type ViewMode = "street" | "schematic";
const MAP_HTML = buildMapHtml();

type CanvasProps = {
  payload: MapPayload & { dark: boolean };
  fitKey: number;
  style: StyleProp<ViewStyle>;
  onReady: () => void;
  onFailure: (reason: string) => void;
  onMapIssue: () => void;
  onSelectIncident: (id: string) => void;
  onSelectRoute?: (id: string) => void;
};

function MapCanvas({
  payload,
  fitKey,
  style,
  onReady,
  onFailure,
  onMapIssue,
  onSelectIncident,
  onSelectRoute,
}: CanvasProps) {
  const webViewRef = useRef<WebView>(null);
  const lastFitKey = useRef<number | null>(null);
  const lastYou = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const shouldFit = lastFitKey.current !== fitKey;
    const next = { ...payload, fit: shouldFit };
    if (shouldFit) lastFitKey.current = fitKey;
    webViewRef.current?.injectJavaScript(`window.trafficMap?.setData(${JSON.stringify(next)}); true;`);
  }, [payload, fitKey, ready]);

  useEffect(() => {
    const coordinates = payload.you?.coordinates;
    if (!ready || !coordinates) return;
    const key = coordinates.join(",");
    if (key === lastYou.current) return;
    lastYou.current = key;
    webViewRef.current?.injectJavaScript(`window.trafficMap?.centerOn(${JSON.stringify(coordinates)}); true;`);
  }, [payload.you, ready]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string; reason?: string };
      if (message.type === "ready") {
        setReady(true);
        onReady();
      } else if (message.type === "failed") {
        onFailure(message.reason ?? "renderer");
      } else if (message.type === "map-error") {
        onMapIssue();
      } else if (message.type === "select-incident" && message.id) {
        onSelectIncident(message.id);
      } else if (message.type === "select-route" && message.id) {
        onSelectRoute?.(message.id);
      }
    } catch {
      onFailure("message");
    }
  }

  return (
    <WebView
      ref={webViewRef}
      style={style}
      source={{ html: MAP_HTML }}
      originWhitelist={["*"]}
      userAgent="TrafficSenseMobile/0.1 (OpenStreetMap tile client)"
      cacheEnabled
      javaScriptEnabled
      domStorageEnabled
      onMessage={handleMessage}
      onError={() => onFailure("webview")}
      onHttpError={() => onFailure("network")}
      accessibilityLabel="Interactive OpenStreetMap traffic map"
    />
  );
}

export function TrafficMap(props: Props) {
  const { colors, isDark, shadows } = useTheme();
  const [mode, setMode] = useState<ViewMode>("street");
  const [you, setYou] = useState<[number, number] | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [mapLoading, setMapLoading] = useState(true);

  const payload = useMemo(
    () => ({
      ...buildMapPayload({
        segments: props.segments,
        incidents: props.incidents,
        routes: props.routes,
        alternativeId: props.alternativeId,
        selectedIncidentId: props.selectedIncidentId,
        selectedRouteId: props.selectedRouteId,
        you,
        fit: false,
      }),
      dark: isDark,
    }),
    [
      props.segments,
      props.incidents,
      props.routes,
      props.alternativeId,
      props.selectedIncidentId,
      props.selectedRouteId,
      you,
      isDark,
    ],
  );

  useEffect(() => {
    if (mode !== "street" || !mapLoading) return;
    const timeout = setTimeout(() => {
      setMode("schematic");
      setMapLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [mode, mapLoading]);

  async function locateMe() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) return;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setYou([position.coords.longitude, position.coords.latitude]);
      setFitRequest((v) => v + 1);
    } catch {
      // Fail gracefully without interrupting map browsing
    }
  }

  const heightStyle = props.fullScreen
    ? { flex: 1 }
    : { height: props.mapHeight ?? 240 };

  const controlsBottom = props.controlsBottomOffset ?? 16;
  const attributionBottom = props.attributionBottomOffset ?? 12;

  return (
    <View style={[styles.container, heightStyle, { backgroundColor: isDark ? "#121618" : "#F2F3F0" }]}>
      {mode === "street" ? (
        <MapCanvas
          payload={payload}
          fitKey={props.fitKey + fitRequest}
          style={StyleSheet.absoluteFill}
          onReady={() => setMapLoading(false)}
          onFailure={() => {
            setMapLoading(false);
            setMode("schematic");
          }}
          onMapIssue={() => {}}
          onSelectIncident={props.onSelectIncident}
          onSelectRoute={props.onSelectRoute}
        />
      ) : (
        <SchematicMap
          segments={props.segments}
          incidents={props.incidents}
          routes={props.routes}
          alternativeId={props.alternativeId}
          selectedIncidentId={props.selectedIncidentId}
          selectedRouteId={props.selectedRouteId}
          onSelectIncident={props.onSelectIncident}
        />
      )}

      {/* Map Controls Pill: layers / locate */}
      {!props.hideControls ? (
        <View
          style={[
            styles.controlsPill,
            {
              bottom: controlsBottom,
              backgroundColor: colors.surface,
              borderColor: colors.navEdge,
            },
            shadows.nav,
          ]}
        >
          {!props.showOnlyLocate ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Map layers"
                onPress={() => setMode((m) => (m === "street" ? "schematic" : "street"))}
                style={styles.controlBtn}
              >
                <Icon name="layers" size={20} color={colors.text} />
              </Pressable>
              <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />
            </>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show my location"
            onPress={() => void locateMe()}
            style={styles.controlBtn}
          >
            <Icon name="navigation" size={20} color={colors.accent} filled />
          </Pressable>
        </View>
      ) : null}

      {/* OpenStreetMap Attribution */}
      {!props.hideAttribution ? (
        <Text
          style={[
            styles.attribution,
            {
              bottom: attributionBottom,
              color: colors.text3,
            },
          ]}
        >
          © OpenStreetMap
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  controlsPill: {
    position: "absolute",
    right: 16,
    width: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 20,
  },
  controlBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  controlDivider: {
    height: 1,
    marginHorizontal: 10,
  },
  attribution: {
    position: "absolute",
    left: 16,
    fontSize: 10,
    fontWeight: "500",
    zIndex: 15,
  },
});
