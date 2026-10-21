// Visual tokens copied from the web design reference (docs/design/trafficsense).
// Keep these values in sync with the web theme rather than introducing new colours.
export const colors = {
  background: "#faf8ff",
  surface: "#ffffff",
  border: "#e2e7ff",
  primary: "#005c55",
  primaryPressed: "#004741",
  onPrimary: "#ffffff",
  secondaryBorder: "#cbd5e1",
  text: "#131b2e",
  textSecondary: "#3e4947",
  textMuted: "#5f6b69",
  evidence: "#6616d7",
  evidenceSurface: "#f3edff",
  warning: "#904d00",
  warningAccent: "#fe932c",
  warningSurface: "#fff4e5",
  error: "#ba1a1a",
  errorSurface: "#fff0ed",
  success: "#176d55",
} as const;

// Minimum comfortable touch target for controls on a phone.
export const minTouchTarget = 44;

export const radius = { card: 14, control: 12 } as const;

export const space = { xs: 6, sm: 10, md: 16, lg: 24 } as const;
