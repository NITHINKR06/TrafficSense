import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AccessibilityInfo, useColorScheme } from "react-native";
import {
  darkColors,
  getShadows,
  lightColors,
  type ColorPalette,
  type ResolvedTheme,
  type ThemeMode,
} from "./tokens";

const THEME_STORAGE_KEY = "trafficsense.theme_mode";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: ColorPalette;
  shadows: ReturnType<typeof getShadows>;
  reduceMotion: boolean;
  setMode: (next: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .catch(() => {});

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(Boolean(enabled));
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const resolved: ResolvedTheme = useMemo(() => {
    if (mode === "light" || mode === "dark") return mode;
    return systemScheme === "dark" ? "dark" : "light";
  }, [mode, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      isDark: resolved === "dark",
      colors: resolved === "dark" ? darkColors : lightColors,
      shadows: getShadows(resolved),
      reduceMotion,
      setMode,
    }),
    [mode, resolved, reduceMotion, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: "system",
      resolved: "light",
      isDark: false,
      colors: lightColors,
      shadows: getShadows("light"),
      reduceMotion: false,
      setMode: () => {},
    };
  }
  return ctx;
}
