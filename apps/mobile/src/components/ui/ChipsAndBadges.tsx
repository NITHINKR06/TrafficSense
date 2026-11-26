import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/theme-provider";
import { radius, size as sizes } from "../../theme/tokens";

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function FilterChip({ label, selected = false, onPress, style }: FilterChipProps) {
  const { colors, shadows } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: selected ? colors.text : colors.surface,
          borderColor: selected ? colors.text : colors.border,
          borderWidth: 1,
        },
        pressed && { transform: [{ scale: 0.96 }] },
        !selected && shadows.sm,
        style,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: selected ? colors.background : colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
  fullWidth = false,
  style,
}: SegmentedControlProps<T>) {
  const { colors, shadows } = useTheme();
  const trackHeight = size === "md" ? 44 : 36;
  const segHeight = trackHeight - 6;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.segTrack,
        {
          height: trackHeight,
          backgroundColor: colors.surface2,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[
              styles.segItem,
              {
                height: segHeight,
                flex: fullWidth ? 1 : undefined,
                paddingHorizontal: size === "md" ? 16 : 12,
                backgroundColor: active ? colors.surface : "transparent",
              },
              active && shadows.sm,
            ]}
          >
            <Text
              style={[
                styles.segText,
                {
                  fontSize: size === "md" ? 14 : 13,
                  color: active ? colors.text : colors.text2,
                },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SimulatedTagProps = {
  label?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SimulatedTag({ label = "Simulated", compact = false, style }: SimulatedTagProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={`Data notice: ${label}`}
      style={[
        styles.simulatedTag,
        {
          height: compact ? 20 : 24,
          paddingHorizontal: compact ? 8 : 9,
          borderColor: colors.text3,
        },
        style,
      ]}
    >
      <Text style={[styles.simulatedText, { color: colors.text2 }]}>{label}</Text>
    </View>
  );
}

const BAR_HEIGHTS = [4, 6, 8, 10, 12, 14] as const;

export function tierLevelNumber(level: string): number {
  const match = /L([1-6])/i.exec(level);
  if (match) return Number(match[1]);
  return 1;
}

type TierBadgeProps = {
  level: string | number;
  standalone?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TierBadge({ level, standalone = true, style }: TierBadgeProps) {
  const { colors } = useTheme();
  const n = typeof level === "number" ? level : tierLevelNumber(level);
  const label = `L${Math.max(1, Math.min(6, n))}`;

  return (
    <View
      accessibilityLabel={`Evidence tier ${label}`}
      style={[
        styles.tierBadge,
        standalone && {
          height: 26,
          paddingHorizontal: 9,
          borderRadius: 13,
          backgroundColor: colors.surface2,
        },
        style,
      ]}
    >
      <View style={styles.tierBars}>
        {BAR_HEIGHTS.map((h, idx) => (
          <View
            key={h}
            style={[
              styles.tierBar,
              {
                height: h,
                backgroundColor: idx < n ? colors.accent : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.tierLabel, { color: colors.text2 }]}>{label}</Text>
    </View>
  );
}

type LiveDotProps = {
  time: string;
  style?: StyleProp<ViewStyle>;
};

export function LiveDot({ time, style }: LiveDotProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.liveRow, style]}>
      <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
      <Text style={[styles.liveText, { color: colors.text3 }]}>{time}</Text>
    </View>
  );
}

type FreshnessChipProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function FreshnessChip({ label, style }: FreshnessChipProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={`Freshness: ${label}`}
      style={[styles.freshnessChip, { backgroundColor: colors.warningSoft }, style]}
    >
      <Text style={[styles.freshnessText, { color: colors.warning }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    height: sizes.buttonS,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  segTrack: {
    padding: 3,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  segItem: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segText: {
    fontWeight: "600",
  },
  simulatedTag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  simulatedText: {
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  tierBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 14,
  },
  tierBar: {
    width: 3,
    borderRadius: 1,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  freshnessChip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  freshnessText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
