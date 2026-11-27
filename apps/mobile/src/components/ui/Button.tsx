import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/theme-provider";
import { radius, size as sizes } from "../../theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "tonal" | "text" | "danger" | "signout";
export type ButtonSize = "L" | "L-sheet" | "M" | "S";

type ButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "L",
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  icon,
  trailingIcon,
}: ButtonProps) {
  const { colors } = useTheme();
  const [lockedWidth, setLockedWidth] = useState<number | undefined>(undefined);
  const isInteractive = !disabled && !loading;

  const height =
    size === "L-sheet"
      ? sizes.buttonLSheet
      : size === "L"
        ? sizes.buttonL
        : size === "M"
          ? sizes.buttonM
          : sizes.buttonS;

  const padX = size === "S" ? 12 : size === "M" ? 16 : 20;
  const borderRadius =
    size === "L-sheet"
      ? radius.buttonLg
      : size === "L"
        ? radius.button
        : size === "M"
          ? radius.input
          : 18;
  const fontSize = size === "S" ? 13 : size === "M" ? 14 : size === "L-sheet" ? 17 : 16;

  const hitSlop = height < sizes.touchTarget ? { top: 6, bottom: 6, left: 4, right: 4 } : undefined;

  const getBg = (pressed: boolean): string => {
    if (disabled) {
      return variant === "text" ? "transparent" : colors.surface2;
    }
    switch (variant) {
      case "primary":
        return pressed ? colors.accentPressed : colors.accent;
      case "secondary":
        return pressed ? colors.surface2 : colors.surface;
      case "tonal":
        return pressed ? colors.accentTonalPressed : colors.accentSoft;
      case "text":
        return pressed ? colors.accentSoft : "transparent";
      case "danger":
        return pressed ? colors.dangerPressed : colors.dangerSoft;
      case "signout":
        return pressed ? colors.surface2 : colors.surface;
    }
  };

  const getFg = (): string => {
    if (disabled) return colors.text3;
    switch (variant) {
      case "primary":
        return colors.onAccent;
      case "secondary":
        return colors.text;
      case "tonal":
      case "text":
        return colors.accent;
      case "danger":
      case "signout":
        return colors.danger;
    }
  };

  const borderStyle: ViewStyle =
    variant === "secondary" || variant === "signout"
      ? { borderWidth: 1, borderColor: disabled ? "transparent" : colors.borderStrong }
      : {};

  const fg = getFg();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      disabled={!isInteractive}
      hitSlop={hitSlop}
      onLayout={(e) => {
        if (!loading && e.nativeEvent.layout.width > 0) {
          setLockedWidth(e.nativeEvent.layout.width);
        }
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal: padX,
          borderRadius,
          backgroundColor: getBg(pressed && isInteractive),
          minWidth: loading && lockedWidth ? lockedWidth : undefined,
        },
        pressed && isInteractive && { transform: [{ scale: 0.97 }] },
        borderStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              { fontSize, color: fg },
              textStyle,
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {trailingIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontWeight: "600",
    textAlign: "center",
  },
});
