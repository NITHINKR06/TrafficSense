import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle, type TextStyle, type GestureResponderEvent } from "react-native";
import { colors, minTouchTarget, radius, shadows, typography } from "../../theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "floating";

type ButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      disabled={!isInteractive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "floating" ? colors.onPrimary : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text`],
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: radius.control,
    gap: 8,
  },
  textBase: {
    ...typography.labelLg,
    textAlign: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryPressed: {
    backgroundColor: "rgba(0, 92, 85, 0.08)",
  },
  secondaryText: {
    color: colors.primary,
    fontWeight: "700",
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlinePressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  outlineText: {
    color: colors.text,
    fontWeight: "600",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  ghostPressed: {
    opacity: 0.7,
  },
  ghostText: {
    color: colors.primary,
    fontWeight: "600",
  },
  floating: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    ...shadows.floating,
  },
  floatingPressed: {
    backgroundColor: colors.primaryPressed,
  },
  floatingText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
