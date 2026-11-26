import * as Location from "expo-location";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mangaluruPlaces, type PlacePreset } from "../lib/places";
import { useTheme } from "../theme/theme-provider";
import { radius, typography } from "../theme/tokens";
import { Icon, IconButton, ModalSheet } from "./ui";

type PlacePickerModalProps = {
  visible: boolean;
  title: string;
  selectedIndex: number | null;
  disabledIndex?: number | null;
  disabledReason?: string;
  onSelectPreset: (index: number) => void;
  onSelectDeviceLocation?: (coords: [number, number], label: string) => void;
  onClose: () => void;
};

function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(3)}° N · ${lng.toFixed(3)}° E`;
}

export function PlacePickerModal({
  visible,
  title,
  selectedIndex,
  disabledIndex = null,
  disabledReason = "Already set as destination",
  onSelectPreset,
  onSelectDeviceLocation,
  onClose,
}: PlacePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mangaluruPlaces
      .map((place, index) => ({ place, index }))
      .filter(({ place }) => !q || place.name.toLowerCase().includes(q));
  }, [query]);

  async function handleUseMyLocation() {
    if (!onSelectDeviceLocation) return;
    setLocError(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setLocError("Location permission was denied.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      onSelectDeviceLocation([pos.coords.longitude, pos.coords.latitude], "Your location");
      onClose();
    } catch {
      setLocError("Couldn't read your location. Pick a junction below.");
    } finally {
      setLocating(false);
    }
  }

  const renderPlace = ({ item }: { item: { place: PlacePreset; index: number } }) => {
    const { place, index } = item;
    const isSelected = selectedIndex === index;
    const isDisabled = disabledIndex === index;
    const [lng, lat] = place.coords;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isDisabled }}
        disabled={isDisabled}
        onPress={() => {
          onSelectPreset(index);
          onClose();
        }}
        style={({ pressed }) => [
          styles.row,
          {
            borderBottomColor: colors.border,
            opacity: isDisabled ? 0.45 : pressed ? 0.75 : 1,
          },
        ]}
      >
        <View style={[styles.pinCircle, { backgroundColor: colors.surface2 }]}>
          <Icon name="map-pin" size={18} color={colors.text2} />
        </View>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={[styles.rowSub, { color: colors.text3 }]} numberOfLines={1}>
            {isDisabled ? disabledReason : formatCoord(lat, lng)}
          </Text>
        </View>
        {isSelected ? (
          <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
            <Icon name="check" size={14} color={colors.onAccent} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      topOffset={Math.max(insets.top + 44, 96)}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <IconButton
            accessibilityLabel="Close"
            variant="tonal"
            size={44}
            onPress={onClose}
          >
            <Icon name="x" size={18} color={colors.text} />
          </IconButton>
        </View>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.accent },
          ]}
        >
          <Icon name="search" size={20} color={colors.text2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search junctions or landmarks"
            placeholderTextColor={colors.text3}
            accessibilityLabel="Search places"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query.length > 0 ? (
            <Pressable hitSlop={10} onPress={() => setQuery("")} accessibilityLabel="Clear search">
              <Icon name="x" size={16} color={colors.text3} />
            </Pressable>
          ) : null}
        </View>

        {onSelectDeviceLocation ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use my location"
            onPress={() => void handleUseMyLocation()}
            style={({ pressed }) => [styles.locRow, pressed && { opacity: 0.75 }]}
          >
            <View style={[styles.locCircle, { backgroundColor: colors.accentSoft }]}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Icon name="navigation" size={18} color={colors.accent} />
              )}
            </View>
            <View style={styles.locTextCol}>
              <Text style={[styles.locTitle, { color: colors.accent }]}>Use my location</Text>
              <Text style={[styles.locSub, { color: colors.text3 }]}>
                {locError ?? "Asked once, not stored"}
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.text3 }]}>Junctions</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.place.name}
          renderItem={renderPlace}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
        />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    maxHeight: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    ...typography.title,
  },
  searchBox: {
    height: 52,
    borderRadius: radius.input,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  locRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  locCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    ...typography.caption,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.48,
    textTransform: "uppercase",
    marginTop: 4,
  },
  list: {
    marginTop: -8,
  },
  row: {
    height: 64,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.bodySemibold,
  },
  rowSub: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
