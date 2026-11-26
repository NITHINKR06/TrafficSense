import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/theme-provider";
import { radius, space, typography } from "../../theme/tokens";
import { TierBadge } from "./ChipsAndBadges";
import { categoryIconName, categoryTone, Icon, type IconName } from "./Icon";

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  largeRadius?: boolean;
};

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  largeRadius = false,
}: CardProps) {
  const { colors, shadows } = useTheme();
  const baseStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: largeRadius ? radius.cardLg : radius.card,
    padding: space[4],
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          shadows.card,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, shadows.card, style]}>{children}</View>;
}

type HeroCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroCard({ children, style }: HeroCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.hero,
          borderColor: colors.heroBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type StatTileProps = {
  value: string | number;
  label: string;
  warning?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatTile({
  value,
  label,
  warning = false,
  onPress,
  accessibilityLabel,
  style,
}: StatTileProps) {
  const { colors } = useTheme();
  const bg = warning ? colors.warningSoft : colors.surface;
  const bd = warning ? colors.warningSoft : colors.border;
  const fg = warning ? colors.warning : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${value} ${label}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.statTile,
        { backgroundColor: bg, borderColor: bd },
        pressed && onPress && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Text style={[styles.statValue, { color: fg }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.text2 }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

type ListGroupProps = {
  title?: string;
  rightLabel?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ListGroup({ title, rightLabel, children, style }: ListGroupProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.listGroupWrap, style]}>
      {title ? (
        <View style={styles.listGroupHeader}>
          <Text style={[styles.listGroupTitle, { color: colors.text3 }]}>{title}</Text>
          {rightLabel ? (
            <Text style={[styles.listGroupRight, { color: colors.text3 }]}>{rightLabel}</Text>
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          styles.listGroupCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type ListRowProps = {
  icon: IconName;
  label: string;
  sublabel?: string;
  meta?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  first?: boolean;
  accessibilityLabel?: string;
};

export function ListRow({
  icon,
  label,
  sublabel,
  meta,
  trailing,
  showChevron = true,
  onPress,
  first = false,
  accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.listRow,
        !first && { borderTopWidth: 1, borderTopColor: colors.border },
        pressed && onPress && { backgroundColor: colors.surface2 },
      ]}
    >
      <View style={[styles.listIconTile, { backgroundColor: colors.surface2 }]}>
        <Icon name={icon} size={17} color={colors.text} />
      </View>
      <View style={styles.listTextCol}>
        <Text style={[styles.listLabel, { color: colors.text }]} numberOfLines={2}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.listSublabel, { color: colors.text3 }]} numberOfLines={2}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {meta ? (
        <Text style={[styles.listMeta, { color: colors.text3 }]} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
      {trailing}
      {showChevron && !trailing ? (
        <Icon name="chevron-right" size={16} color={colors.text3} />
      ) : null}
    </Pressable>
  );
}

type IncidentRowProps = {
  category: string;
  title: string;
  meta: string;
  level: string;
  onPress: () => void;
  first?: boolean;
};

export function IncidentRow({
  category,
  title,
  meta,
  level,
  onPress,
  first = false,
}: IncidentRowProps) {
  const { colors } = useTheme();
  const tone = categoryTone(category, colors);
  const iconName = categoryIconName(category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${meta}, ${level}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.incidentRow,
        !first && { borderTopWidth: 1, borderTopColor: colors.border },
        pressed && { backgroundColor: colors.surface2 },
      ]}
    >
      <View style={[styles.incidentIconTile, { backgroundColor: tone.bg }]}>
        <Icon name={iconName} size={19} color={tone.fg} />
      </View>
      <View style={styles.incidentTextCol}>
        <Text style={[styles.incidentTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.incidentMeta, { color: colors.text3 }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <TierBadge level={level} standalone={false} />
      <Icon name="chevron-right" size={16} color={colors.text3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.hero,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  statTile: {
    height: 88,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.48,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
  },
  listGroupWrap: {
    gap: 8,
  },
  listGroupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  listGroupTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.72,
    textTransform: "uppercase",
  },
  listGroupRight: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  listGroupCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: "hidden",
  },
  listRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listIconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listTextCol: {
    flex: 1,
    gap: 2,
  },
  listLabel: {
    ...typography.bodyMedium,
  },
  listSublabel: {
    ...typography.small,
  },
  listMeta: {
    ...typography.caption,
  },
  incidentRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  incidentIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.iconTile,
    alignItems: "center",
    justifyContent: "center",
  },
  incidentTextCol: {
    flex: 1,
    gap: 2,
  },
  incidentTitle: {
    ...typography.bodySemibold,
  },
  incidentMeta: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
});
