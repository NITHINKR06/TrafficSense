import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import type { ReportCategory } from "@trafficsense/shared";
import { PlacePickerModal } from "../src/components/PlacePickerModal";
import { TrafficMap } from "../src/components/traffic-map";
import {
  Banner,
  Button,
  DetailField,
  Icon,
  IconButton,
  StateCard,
  TierBadge,
  type IconName,
} from "../src/components/ui";
import { submitIncident } from "../src/lib/api";
import { categoryLabel } from "../src/lib/format";
import { mangaluruPlaces } from "../src/lib/places";
import { toReportLocationInput, type ReportLocation } from "../src/lib/report-location";
import { MobileApiError } from "../src/lib/request";
import { verifyEvidence, type L5VerifyResult } from "../src/lib/verify-evidence";
import { useAuth } from "../src/providers/auth-provider";
import { useTheme } from "../src/theme/theme-provider";
import { motion, radius, space, typography } from "../src/theme/tokens";

type CategoryOption = {
  category: ReportCategory;
  label: string;
  icon: IconName;
};

const CATEGORIES: CategoryOption[] = [
  { category: "accident", label: "Accident", icon: "octagon-alert" },
  { category: "road_closed", label: "Closed", icon: "circle-minus" },
  { category: "heavy_traffic", label: "Traffic", icon: "car" },
  { category: "flood", label: "Flooding", icon: "droplet" },
  { category: "road_repair", label: "Road works", icon: "construction" },
  { category: "other", label: "Other", icon: "circle-alert" },
];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { colors, shadows, reduceMotion } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [locationOff, setLocationOff] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [l5Result, setL5Result] = useState<L5VerifyResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentData, setSentData] = useState<{
    category: ReportCategory;
    placeLabel: string;
    level: string;
  } | null>(null);
  const [undoSeconds, setUndoSeconds] = useState(10);

  const [checkPop] = useState(() => new Animated.Value(0));
  const [ringAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!sentData) return;
    if (reduceMotion) {
      checkPop.setValue(1);
    } else {
      Animated.spring(checkPop, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 900,
        easing: motion.easing.enter,
        useNativeDriver: true,
      }).start();
    }

    const interval = setInterval(() => {
      setUndoSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sentData, checkPop, ringAnim, reduceMotion]);

  async function pickPhoto() {
    setErrorMsg(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      setErrorMsg("Photo library permission is needed to attach a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.3,
      base64: true,
      exif: false,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      if (asset.base64 && asset.base64.length > 5_600_000) {
        setErrorMsg("Photo is too large. Choose a smaller image (max 4 MB).");
        return;
      }
      setCapturedImage({
        uri: asset.uri,
        base64: asset.base64!,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  }

  async function resolveLocationOnSend(): Promise<ReportLocation | null> {
    if (location) return location;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setLocationOff(true);
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const resolved: ReportLocation = {
        source: "device",
        label: "Current device location",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        gpsAccuracyM: pos.coords.accuracy ?? null,
        gpsFixAt: new Date(pos.timestamp).toISOString(),
      };
      setLocation(resolved);
      return resolved;
    } catch {
      setLocationOff(true);
      return null;
    }
  }

  async function handleSend() {
    if (!selectedCategory || !session || submitting) return;
    setErrorMsg(null);
    setLocationOff(false);
    setSubmitting(true);

    try {
      const resolvedLocation = await resolveLocationOnSend();
      if (!resolvedLocation) {
        setSubmitting(false);
        return;
      }

      let verifiedResult: L5VerifyResult | undefined;
      let photoDataUrl: string | null = null;
      if (capturedImage) {
        const candidateUrl = `data:${capturedImage.mimeType};base64,${capturedImage.base64}`;
        if (candidateUrl.length <= 1_200_000) {
          photoDataUrl = candidateUrl;
        }
        const verifyRes = await verifyEvidence(
          {
            imageBase64: capturedImage.base64,
            mimeType: capturedImage.mimeType,
            userSelectedCategory: selectedCategory,
            lat: resolvedLocation.lat,
            lng: resolvedLocation.lng,
          },
          session.access_token,
        );
        if (verifyRes.ok) {
          verifiedResult = verifyRes.result;
          setL5Result(verifiedResult);
        }
      }

      const locInput = toReportLocationInput(resolvedLocation);
      const res = await submitIncident(
        {
          category: selectedCategory,
          ...locInput,
          note: note.trim() || null,
          l5Verified: Boolean(verifiedResult?.upgradeEligible),
          l5Summary: verifiedResult?.summary ?? null,
          l5PhotoDataUrl: photoDataUrl,
          l5ConfidenceTier: verifiedResult?.confidenceTier ?? null,
        },
        session.access_token,
      );

      setUndoSeconds(10);
      setSentData({
        category: selectedCategory,
        placeLabel: resolvedLocation.label,
        level: res.level ?? (verifiedResult?.upgradeEligible ? "L5" : "L1"),
      });
    } catch (err) {
      if (err instanceof MobileApiError && err.status === 401) {
        setErrorMsg("Sign in again to send reports.");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Report could not be sent.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const locationTitle = location ? location.label : "Near Jyothi Circle";
  const locationSub = location
    ? location.source === "device"
      ? "Your location · asked only now"
      : "Picked junction · no GPS used"
    : "Your location · asked only now";

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.6] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Map Context */}
      <View style={StyleSheet.absoluteFill}>
        <TrafficMap
          fullScreen
          incidents={[]}
          segments={[]}
          selectedIncidentId={null}
          onSelectIncident={() => {}}
          fitKey={1}
          hideControls
          hideAttribution
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />

        {/* Centered Pin Chip */}
        <View style={[styles.pinContainer, { top: Math.max(insets.top + 28, 72) }]}>
          <View style={[styles.pinChip, { backgroundColor: colors.surface }, shadows.sm]}>
            <Text style={[styles.pinChipText, { color: colors.text }]}>
              {sentData ? "Your report" : "Report here"}
            </Text>
          </View>
          <Svg width={34} height={44} viewBox="-14 -36 28 38">
            <Path
              d="M0 0C-3-5-12-11-12-20A12 12 0 1 1 12-20C12-11 3-5 0 0Z"
              fill={colors.accent}
              stroke={colors.surface}
              strokeWidth={2}
            />
            <Circle cy={-20} r={4.5} fill={colors.surface} />
          </Svg>
        </View>
      </View>

      {/* Bottom Modal Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetWrap}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.sheet,
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
            shadows.sheet,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.handle }]} />

          {sentData ? (
            /* SENT STATE */
            <View style={styles.sentWrap}>
              <View style={styles.sentCircleBox}>
                <Animated.View
                  style={[
                    styles.sentRing,
                    {
                      borderColor: colors.accent,
                      opacity: ringOpacity,
                      transform: [{ scale: ringScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.sentCircle,
                    {
                      backgroundColor: colors.accent,
                      transform: [{ scale: checkPop }],
                    },
                  ]}
                >
                  <Icon name="check" size={40} color={colors.onAccent} strokeWidth={2.6} />
                </Animated.View>
              </View>

              <Text style={[styles.sentTitle, { color: colors.text }]}>Report sent</Text>
              <Text style={[styles.sentSub, { color: colors.text2 }]}>
                {categoryLabel(sentData.category)} · {sentData.placeLabel} · thank you
              </Text>

              <View
                style={[
                  styles.sentCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <TierBadge level={sentData.level} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.sentCardTitle, { color: colors.text }]}>
                    Visible to nearby commuters
                  </Text>
                  <Text style={[styles.sentCardSub, { color: colors.text3 }]}>
                    Trust rises as others confirm it
                  </Text>
                </View>
              </View>

              <Button
                title="View on map"
                size="L-sheet"
                variant="primary"
                onPress={() => router.replace("/traffic")}
                style={{ width: "100%", marginTop: 24 }}
              />

              <View style={styles.sentFooterRow}>
                <Button
                  title="Done"
                  size="M"
                  variant="text"
                  onPress={() => router.back()}
                  textStyle={{ color: colors.text }}
                  style={{ flex: 1 }}
                />
                {undoSeconds > 0 ? (
                  <Button
                    title={`Undo · ${undoSeconds} s`}
                    size="M"
                    variant="text"
                    onPress={() => setSentData(null)}
                    textStyle={{ color: colors.text2 }}
                    style={{ flex: 1 }}
                  />
                ) : null}
              </View>
            </View>
          ) : (
            /* COMPOSE / GUEST GATE */
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.composeContent}
            >
              <View style={styles.composeHeader}>
                <Text style={[styles.composeTitle, { color: colors.text }]}>
                  What’s happening?
                </Text>
                <IconButton
                  accessibilityLabel="Close"
                  variant="tonal"
                  size={40}
                  onPress={() => router.back()}
                >
                  <Icon name="x" size={16} color={colors.text} strokeWidth={2.4} />
                </IconButton>
              </View>

              {!session ? (
                <Banner
                  variant="warning"
                  title="Sign in to send reports"
                  body="Browsing stays open to everyone."
                  actionLabel="Sign in"
                  onAction={() => router.push("/auth/login?next=/report")}
                />
              ) : null}

              {locationOff ? (
                <StateCard
                  variant="location-off"
                  onAction={() => {
                    setLocationOff(false);
                    setPickerOpen(true);
                  }}
                />
              ) : null}

              {errorMsg ? (
                <Banner
                  variant="danger"
                  icon="circle-alert"
                  title={errorMsg}
                  onDismiss={() => setErrorMsg(null)}
                />
              ) : null}

              {/* 3x2 Category Grid */}
              <View accessibilityRole="radiogroup" style={styles.catGrid}>
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.category;
                  return (
                    <Pressable
                      key={cat.category}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => setSelectedCategory(cat.category)}
                      style={styles.catItem}
                    >
                      <View
                        style={[
                          styles.catCircle,
                          {
                            backgroundColor: active ? colors.accent : colors.surface2,
                            borderWidth: active ? 4 : 0,
                            borderColor: active ? colors.accentSoft : "transparent",
                          },
                        ]}
                      >
                        <Icon
                          name={cat.icon}
                          size={26}
                          color={active ? colors.onAccent : colors.text}
                          strokeWidth={1.9}
                        />
                      </View>
                      <Text
                        style={[
                          styles.catLabel,
                          {
                            color: active ? colors.text : colors.text2,
                            fontWeight: active ? "600" : "500",
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Location Row */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Location: ${locationTitle}. Tap Change to pick a junction.`}
                onPress={() => setPickerOpen(true)}
                style={[
                  styles.locRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.locIconTile, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="navigation" size={18} color={colors.accent} filled />
                </View>
                <View style={styles.locTextCol}>
                  <Text style={[styles.locTitle, { color: colors.text }]} numberOfLines={1}>
                    {locationTitle}
                  </Text>
                  <Text style={[styles.locSub, { color: colors.text3 }]} numberOfLines={1}>
                    {locationSub}
                  </Text>
                </View>
                <Text style={[styles.changeText, { color: colors.accent }]}>Change</Text>
              </Pressable>

              {/* Detail + L5 Photo */}
              <View style={styles.detailRow}>
                <DetailField
                  value={note}
                  onChangeText={setNote}
                  style={{ flex: 1 }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo, can raise trust to L5"
                  onPress={() => void pickPhoto()}
                  style={[
                    styles.photoBtn,
                    {
                      borderColor: capturedImage ? colors.accent : colors.text3,
                      backgroundColor: capturedImage ? colors.accentSoft : "transparent",
                    },
                  ]}
                >
                  {capturedImage ? (
                    <Image source={{ uri: capturedImage.uri }} style={styles.photoThumb} />
                  ) : (
                    <>
                      <Icon name="camera" size={20} color={colors.text} />
                      <Text style={[styles.l5Text, { color: colors.accent }]}>L5</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {l5Result && l5Result.upgradeEligible ? (
                <Text style={[styles.l5Note, { color: colors.accent }]}>
                  Photo verified · {l5Result.summary}
                </Text>
              ) : null}

              {/* Trust Line */}
              <View style={styles.trustRow}>
                <TierBadge level={capturedImage ? "L5" : "L1"} standalone={false} />
                <Text style={[styles.trustText, { color: colors.text3 }]}>
                  Starts as a single report. Rises as others confirm.
                </Text>
              </View>

              <Button
                title="Send report"
                size="L-sheet"
                variant="primary"
                disabled={!selectedCategory || !session}
                loading={submitting}
                onPress={() => void handleSend()}
                style={{ marginTop: 4 }}
              />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={pickerOpen}
        title="Choose location"
        selectedIndex={null}
        onSelectPreset={(idx) => {
          const p = mangaluruPlaces[idx];
          setLocation({
            source: "reference",
            label: p.name,
            lat: p.coords[1],
            lng: p.coords[0],
            gpsAccuracyM: null,
            gpsFixAt: null,
          });
        }}
        onSelectDeviceLocation={([lng, lat], label) => {
          setLocation({
            source: "device",
            label,
            lat,
            lng,
            gpsAccuracyM: null,
            gpsFixAt: new Date().toISOString(),
          });
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pinContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    gap: 6,
  },
  pinChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    justifyContent: "center",
  },
  pinChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sheetWrap: {
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.modalSheet,
    borderTopRightRadius: radius.modalSheet,
    paddingTop: 8,
    paddingHorizontal: space.gutter,
    maxHeight: "88%",
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
  composeContent: {
    paddingTop: 14,
    gap: 16,
  },
  composeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  composeTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
    letterSpacing: -0.48,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  catItem: {
    width: "33.333%",
    alignItems: "center",
    gap: 8,
  },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    ...typography.caption,
  },
  locRow: {
    height: 64,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.iconTile,
    alignItems: "center",
    justifyContent: "center",
  },
  locTextCol: {
    flex: 1,
    gap: 1,
  },
  locTitle: {
    ...typography.bodySemibold,
  },
  locSub: {
    ...typography.small,
  },
  changeText: {
    ...typography.secondary,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    overflow: "hidden",
  },
  photoThumb: {
    width: 56,
    height: 56,
  },
  l5Text: {
    fontSize: 9,
    fontWeight: "700",
  },
  l5Note: {
    ...typography.small,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  trustText: {
    flex: 1,
    ...typography.small,
  },
  sentWrap: {
    paddingTop: 28,
    alignItems: "center",
    textAlign: "center",
  },
  sentCircleBox: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  sentRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 44,
    borderWidth: 2,
  },
  sentCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sentTitle: {
    marginTop: 24,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "600",
    letterSpacing: -0.52,
  },
  sentSub: {
    marginTop: 6,
    ...typography.body,
    textAlign: "center",
  },
  sentCard: {
    marginTop: 24,
    width: "100%",
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sentCardTitle: {
    ...typography.secondary,
    fontWeight: "600",
  },
  sentCardSub: {
    ...typography.small,
  },
  sentFooterRow: {
    marginTop: 10,
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
});
