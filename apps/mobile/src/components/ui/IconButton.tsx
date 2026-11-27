import { Pressable, StyleSheet, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/theme-provider";
import { radius, size as sizes } from "../../theme/tokens";

export type IconButtonVariant = "tonal" | "outline" | "glass" | "accent" | "ghost";

type IconButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function IconButton({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = "tonal",
  size = sizes.buttonM,
  disabled = false,
  style,
  children,
}: IconButtonProps) {
  const { colors, shadows } = useTheme();
  const isAccentSquare = variant === "accent";
  const borderRadius = isAccentSquare ? radius.input : size / 2;
  const slop = size < sizes.touchTarget ? Math.ceil((sizes.touchTarget - size) / 2) : 0;

  const getBg = (pressed: boolean) => {
    if (disabled) return colors.surface2;
    switch (variant) {
      case "tonal":
        return pressed ? colors.border : colors.surface2;
      case "outline":
      case "glass":
        return pressed ? colors.surface2 : colors.surface;
      case "accent":
        return pressed ? colors.accentPressed : colors.accent;
      case "ghost":
        return pressed ? colors.surface2 : "transparent";
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={slop > 0 ? slop : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: getBg(pressed && !disabled),
        },
        pressed && !disabled && { transform: [{ scale: 0.94 }] },
        variant === "outline" && { borderWidth: 1, borderColor: colors.border },
        variant === "glass" && [{ borderWidth: 1, borderColor: colors.navEdge }, shadows.sm],
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
