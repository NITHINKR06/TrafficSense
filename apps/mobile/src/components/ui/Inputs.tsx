import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/theme-provider";
import { radius, typography } from "../../theme/tokens";
import { Icon } from "./Icon";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  rightAction?: React.ReactNode;
};

export function TextField({
  label,
  error,
  helperText,
  containerStyle,
  rightAction,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const hasError = Boolean(error);
  const borderWidth = hasError || focused ? 2 : 1;
  const borderColor = hasError
    ? colors.danger
    : focused
      ? colors.accent
      : colors.border;
  const labelColor = hasError
    ? colors.danger
    : focused
      ? colors.accent
      : colors.text3;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.fieldBox,
          {
            backgroundColor: editable ? colors.surface : colors.surface2,
            borderColor,
            borderWidth,
            paddingHorizontal: borderWidth === 2 ? 15 : 16,
          },
        ]}
      >
        <View style={styles.inputCol}>
          <Text style={[styles.floatingLabel, { color: labelColor }]}>{label}</Text>
          <TextInput
            {...rest}
            editable={editable}
            placeholderTextColor={colors.text3}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
        {rightAction}
      </View>

      {hasError ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Icon name="circle-alert" size={14} color={colors.danger} strokeWidth={2.2} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.text3 }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

type PasswordFieldProps = Omit<TextFieldProps, "secureTextEntry" | "rightAction">;

export function PasswordField(props: PasswordFieldProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      rightAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          onPress={() => setVisible((v) => !v)}
          hitSlop={4}
          style={styles.eyeButton}
        >
          <Icon
            name={visible ? "eye-off" : "eye"}
            size={20}
            color={colors.text3}
          />
        </Pressable>
      }
    />
  );
}

type SearchFieldProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  height?: 56 | 52;
  focused?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = "Where to?",
  height = 56,
  focused = false,
  onPress,
  trailing,
  accessibilityLabel,
  style,
}: SearchFieldProps) {
  const { colors, shadows } = useTheme();
  const borderRadius = height === 56 ? 28 : 26;

  const content = (
    <View
      style={[
        styles.searchBox,
        {
          height,
          borderRadius,
          backgroundColor: colors.surface,
          borderColor: focused ? colors.accent : colors.border,
          borderWidth: focused ? 2 : 1,
          paddingLeft: height === 56 ? 20 : 18,
          paddingRight: height === 56 ? 8 : 6,
        },
        height === 52 && shadows.sm,
        style,
      ]}
    >
      <Icon name="search" size={20} color={height === 56 ? colors.text : colors.text2} strokeWidth={2.2} />
      {onPress ? (
        <Text style={[styles.searchPlaceholder, { color: colors.text2 }]} numberOfLines={1}>
          {placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          accessibilityLabel={accessibilityLabel ?? placeholder}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
      )}
      {trailing}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        onPress={onPress}
        style={({ pressed }) => [pressed && { opacity: 0.92 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

type DetailFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
};

export function DetailField({
  value,
  onChangeText,
  placeholder = "Add a detail · optional",
  maxLength = 300,
  style,
}: DetailFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.detailBox,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.accent : colors.border,
          borderWidth: focused ? 2 : 1,
        },
        style,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Add a detail"
        style={[styles.detailInput, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  fieldBox: {
    height: 60,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
  },
  inputCol: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  floatingLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  errorText: {
    ...typography.caption,
  },
  helperText: {
    ...typography.small,
    paddingHorizontal: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  detailBox: {
    height: 56,
    borderRadius: radius.card,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  detailInput: {
    fontSize: 15,
    padding: 0,
  },
});
