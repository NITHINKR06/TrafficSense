import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/theme-provider";
import { Icon } from "./Icon";

type SwitchControlProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  compact?: boolean;
  disabled?: boolean;
};

export function SwitchControl({
  value,
  onValueChange,
  accessibilityLabel,
  compact = false,
  disabled = false,
}: SwitchControlProps) {
  const { colors } = useTheme();
  const width = compact ? 46 : 52;
  const height = compact ? 28 : 32;
  const thumbSize = compact ? 22 : 26;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={[
        styles.switchTrack,
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: value ? colors.accent : colors.border,
          opacity: disabled ? 0.5 : 1,
          justifyContent: "center",
          paddingHorizontal: 3,
          alignItems: value ? "flex-end" : "flex-start",
        },
      ]}
    >
      <View
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: value ? colors.onAccent : colors.surface,
        }}
      />
    </Pressable>
  );
}

type RadioProps = {
  selected: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Radio({ selected, onPress, accessibilityLabel }: RadioProps) {
  const { colors } = useTheme();
  const circle = (
    <View
      style={[
        styles.radio,
        selected
          ? { borderWidth: 6, borderColor: colors.accent, backgroundColor: colors.surface }
          : { borderWidth: 2, borderColor: colors.text3, backgroundColor: "transparent" },
      ]}
    />
  );

  if (!onPress) return circle;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={14}
      onPress={onPress}
    >
      {circle}
    </Pressable>
  );
}

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

export function Checkbox({ checked, onPress, accessibilityLabel }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={14}
      onPress={onPress}
      style={[
        styles.checkbox,
        checked
          ? { backgroundColor: colors.accent, borderWidth: 0 }
          : { borderWidth: 2, borderColor: colors.text3, backgroundColor: "transparent" },
      ]}
    >
      {checked ? (
        <Icon name="check" size={12} color={colors.onAccent} strokeWidth={3.2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switchTrack: {},
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
