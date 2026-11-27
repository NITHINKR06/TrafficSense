import { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/theme-provider";
import { motion, radius, space, typography } from "../../theme/tokens";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

type BannerProps = {
  variant?: "warning" | "accent" | "danger";
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Banner({
  variant = "warning",
  icon,
  title,
  body,
  actionLabel,
  onAction,
  onDismiss,
  style,
}: BannerProps) {
  const { colors } = useTheme();
  const bg =
    variant === "accent"
      ? colors.accentSoft
      : variant === "danger"
        ? colors.dangerSoft
        : colors.warningSoft;
  const fg =
    variant === "accent"
      ? colors.accent
      : variant === "danger"
        ? colors.danger
        : colors.warning;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: bg }, style]}
    >
      <View style={styles.bannerTop}>
        {icon ? <Icon name={icon} size={18} color={fg} /> : null}
        <View style={styles.bannerTextCol}>
          <Text style={[styles.bannerTitle, { color: fg }]}>{title}</Text>
          {body ? (
            <Text style={[styles.bannerBody, { color: fg }]}>{body}</Text>
          ) : null}
        </View>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            hitSlop={10}
            onPress={onDismiss}
            style={styles.bannerDismiss}
          >
            <Icon name="x" size={16} color={fg} />
          </Pressable>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.bannerActionBtn, { backgroundColor: fg }]}
        >
          <Text style={[styles.bannerActionText, { color: colors.background }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type StateCardProps = {
  variant: "empty" | "error" | "location-off";
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

const STATE_DEFAULTS = {
  empty: {
    icon: "map" as IconName,
    title: "No reports here",
    body: "Nothing reported in this area in the last 3 hours.",
    cta: "Clear filters",
  },
  error: {
    icon: "circle-alert" as IconName,
    title: "Couldn't update",
    body: "The traffic service didn't respond. Showing the last data.",
    cta: "Try again",
  },
  "location-off": {
    icon: "navigation" as IconName,
    title: "Location is off",
    body: "Pick a nearby junction instead. No GPS needed.",
    cta: "Pick a junction",
  },
};

export function StateCard({
  variant,
  title,
  body,
  actionLabel,
  onAction,
  style,
}: StateCardProps) {
  const { colors } = useTheme();
  const def = STATE_DEFAULTS[variant];
  const iconBg =
    variant === "error"
      ? colors.dangerSoft
      : variant === "location-off"
        ? colors.warningSoft
        : colors.surface2;
  const iconFg =
    variant === "error"
      ? colors.danger
      : variant === "location-off"
        ? colors.warning
        : colors.text2;

  return (
    <View
      style={[
        styles.stateCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <View style={[styles.stateIconTile, { backgroundColor: iconBg }]}>
        <Icon name={def.icon} size={20} color={iconFg} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.text }]}>
        {title ?? def.title}
      </Text>
      <Text style={[styles.stateBody, { color: colors.text2 }]}>
        {body ?? def.body}
      </Text>
      {onAction ? (
        <Button
          title={actionLabel ?? def.cta}
          onPress={onAction}
          variant="secondary"
          size="M"
        />
      ) : null}
    </View>
  );
}

export function SkeletonBlock({
  width = "100%",
  height = 12,
  borderRadius = 6,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface2,
        },
        style,
      ]}
    />
  );
}

type ToastProps = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 4000,
}: ToastProps) {
  const { colors, shadows, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      anim.setValue(0);
      return;
    }
    Animated.timing(anim, {
      toValue: 1,
      duration: reduceMotion ? 150 : motion.duration.base,
      easing: motion.easing.enter,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss, anim, reduceMotion]);

  if (!visible) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [reduceMotion ? 0 : 16, 0],
  });

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: 112 + insets.bottom,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: anim,
          transform: [{ translateY }],
        },
        shadows.card,
      ]}
    >
      <Text style={[styles.toastText, { color: colors.text }]} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[styles.toastAction, { color: colors.accent }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  topOffset?: number;
  children: React.ReactNode;
};

export function ModalSheet({
  visible,
  onClose,
  topOffset,
  children,
}: ModalSheetProps) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          accessibilityLabel="Close sheet"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.sheet,
              marginTop: topOffset ?? Math.max(insets.top + 32, 72),
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
            shadows.sheet,
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.handle }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerTextCol: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  bannerBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  bannerDismiss: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerActionBtn: {
    alignSelf: "flex-start",
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  stateCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 18,
    alignItems: "flex-start",
    gap: 10,
  },
  stateIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.iconTile,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    ...typography.bodySemibold,
  },
  stateBody: {
    ...typography.caption,
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 100,
  },
  toastText: {
    flex: 1,
    ...typography.secondary,
    fontWeight: "500",
  },
  toastAction: {
    ...typography.secondary,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.modalSheet,
    borderTopRightRadius: radius.modalSheet,
    paddingTop: 8,
    paddingHorizontal: space.gutter,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
});
