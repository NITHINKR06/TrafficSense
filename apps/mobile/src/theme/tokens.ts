import { Easing, type TextStyle, type ViewStyle } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ColorPalette = {
  background: string;
  surface: string;
  surface2: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentTonalPressed: string;
  onAccent: string;
  warning: string;
  warningSoft: string;
  warningDot: string;
  danger: string;
  dangerSoft: string;
  dangerPressed: string;
  hero: string;
  heroBorder: string;
  heroBorder2: string;
  heroText: string;
  heroText2: string;
  heroText3: string;
  heroAccent: string;
  heroWarn: string;
  heroTrack: string;
  heroTile: string;
  sheet: string;
  handle: string;
  scrim: string;
  navGlass: string;
  navEdge: string;
  navIndicator: string;
  navText: string;
  navTextInactive: string;
  brandBlue: string;
};

export const lightColors: ColorPalette = {
  background: "#F5F6F7",
  surface: "#FFFFFF",
  surface2: "#EEF0F2",
  border: "#E2E5E8",
  borderStrong: "#D5DADE",
  text: "#121619",
  text2: "#4B555E",
  text3: "#68737D",
  accent: "#0B6B5F",
  accentPressed: "#08574D",
  accentSoft: "#E2F0ED",
  accentTonalPressed: "#CFE6E1",
  onAccent: "#FFFFFF",
  warning: "#9A5700",
  warningSoft: "#FCF0DF",
  warningDot: "#D27A12",
  danger: "#B42318",
  dangerSoft: "#FCEBE9",
  dangerPressed: "#F8D9D5",
  hero: "#0E1A19",
  heroBorder: "#0E1A19",
  heroBorder2: "rgba(255,255,255,0.18)",
  heroText: "#FFFFFF",
  heroText2: "#B9C6C3",
  heroText3: "#93A29F",
  heroAccent: "#5CCFBB",
  heroWarn: "#F2B163",
  heroTrack: "rgba(255,255,255,0.14)",
  heroTile: "rgba(255,255,255,0.06)",
  sheet: "#F7F8F9",
  handle: "#D3D8DC",
  scrim: "rgba(18,22,25,0.36)",
  navGlass: "rgba(255,255,255,0.90)",
  navEdge: "rgba(16,24,32,0.06)",
  navIndicator: "#E2F0ED",
  navText: "#0B6B5F",
  navTextInactive: "#5F6A73",
  brandBlue: "#1683E8",
};

export const darkColors: ColorPalette = {
  background: "#0B0F10",
  surface: "#13181A",
  surface2: "#1B2124",
  border: "#252D30",
  borderStrong: "#2E373B",
  text: "#EEF2F3",
  text2: "#A9B4B8",
  text3: "#8A969B",
  accent: "#56C7B3",
  accentPressed: "#46B09D",
  accentSoft: "#0F2C28",
  accentTonalPressed: "#143A34",
  onAccent: "#03211C",
  warning: "#F2AA55",
  warningSoft: "#2A2013",
  warningDot: "#F2AA55",
  danger: "#F7897D",
  dangerSoft: "#331A19",
  dangerPressed: "#42201E",
  hero: "#13201E",
  heroBorder: "#1F3330",
  heroBorder2: "rgba(255,255,255,0.14)",
  heroText: "#EEF2F3",
  heroText2: "#A9B9B5",
  heroText3: "#86978F",
  heroAccent: "#56C7B3",
  heroWarn: "#F2AA55",
  heroTrack: "rgba(255,255,255,0.12)",
  heroTile: "rgba(255,255,255,0.05)",
  sheet: "#0F1415",
  handle: "#2E373B",
  scrim: "rgba(0,0,0,0.55)",
  navGlass: "rgba(27,33,36,0.86)",
  navEdge: "rgba(255,255,255,0.07)",
  navIndicator: "#173B35",
  navText: "#EEF2F3",
  navTextInactive: "#8A969B",
  brandBlue: "#4BA6FF",
};

// Default export for static references during migration
export const colors = lightColors;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  12: 48,
  gutter: 20,
} as const;

export const radius = {
  tag: 8,
  iconTile: 12,
  input: 14,
  button: 16,
  buttonLg: 18,
  card: 20,
  cardLg: 24,
  hero: 28,
  sheet: 28,
  modalSheet: 32,
  pill: 999,
} as const;

export const size = {
  touchTarget: 48,
  buttonL: 52,
  buttonLSheet: 56,
  buttonM: 44,
  buttonS: 36,
  navHeight: 64,
  navWidth: 284,
  navTabWidth: 68,
  navTabHeight: 52,
  navIndicator: [68, 52] as const,
  reportAction: 64,
  screenGutter: 20,
  scrollBottomClearance: 112,
} as const;

export const minTouchTarget = size.touchTarget;

export const motion = {
  duration: {
    press: 100,
    fade: 160,
    base: 240,
    screen: 320,
    back: 240,
    sheet: 420,
  },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    enter: Easing.bezier(0, 0, 0, 1),
    exit: Easing.bezier(0.3, 0, 1, 1),
    glide: Easing.bezier(0.32, 0.72, 0, 1),
    pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  },
} as const;

export const typography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
    letterSpacing: -0.7,
  } as TextStyle,
  welcomeDisplay: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "600",
    letterSpacing: -1.19,
  } as TextStyle,
  heroNumber: {
    fontSize: 56,
    lineHeight: 56,
    fontWeight: "600",
    letterSpacing: -2.24,
    fontVariant: ["tabular-nums"],
  } as TextStyle,
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    letterSpacing: -0.3,
  } as TextStyle,
  heading: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  } as TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  } as TextStyle,
  bodySemibold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  } as TextStyle,
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  } as TextStyle,
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  } as TextStyle,
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  } as TextStyle,
  label: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 0.11,
  } as TextStyle,
} as const;

export function getShadows(theme: ResolvedTheme) {
  if (theme === "dark") {
    return {
      sm: {} as ViewStyle,
      card: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
      } as ViewStyle,
      sheet: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.07)",
      } as ViewStyle,
      nav: {
        borderWidth: 1,
        borderColor: darkColors.navEdge,
      } as ViewStyle,
      fab: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 8,
      } as ViewStyle,
      menu: {
        borderWidth: 1,
        borderColor: darkColors.border,
      } as ViewStyle,
    };
  }
  return {
    sm: {
      shadowColor: "#101820",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    } as ViewStyle,
    card: {
      shadowColor: "#101820",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    } as ViewStyle,
    sheet: {
      shadowColor: "#101820",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.10,
      shadowRadius: 24,
      elevation: 8,
    } as ViewStyle,
    nav: {
      shadowColor: "#101820",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
      elevation: 8,
    } as ViewStyle,
    fab: {
      shadowColor: "#101820",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    } as ViewStyle,
    menu: {
      shadowColor: "#101820",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 40,
      elevation: 10,
    } as ViewStyle,
  };
}
