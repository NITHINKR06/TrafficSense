import { StyleSheet } from "react-native";

export const colors = {
  background: "#faf8ff",
  card: "#ffffff",
  border: "#e2e7ff",
  primary: "#005c55",
  primaryPressed: "#004741",
  text: "#131b2e",
  secondaryText: "#3e4947",
  violet: "#6616d7",
  violetSurface: "#f3edff",
  warning: "#904d00",
  warningSurface: "#fff3e6",
  error: "#ba1a1a",
  errorSurface: "#fff0ed",
} as const;

export const sharedStyles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 24, gap: 16, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 38 },
  body: { color: colors.secondaryText, fontSize: 16, lineHeight: 24 },
  card: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.card },
  input: { minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, color: colors.text, fontSize: 16 },
  primaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.primary },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, backgroundColor: colors.card },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  error: { padding: 12, borderRadius: 10, backgroundColor: colors.errorSurface, color: colors.error, fontSize: 14, lineHeight: 20 },
  simulatedLabel: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.violetSurface, color: colors.violet, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
});
