import * as SecureStore from "expo-secure-store";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { LogoAnimation } from "../src/components/LogoAnimation";
import { AuthProvider, useAuth } from "../src/providers/auth-provider";
import { ThemeProvider, useTheme } from "../src/theme/theme-provider";
import { WELCOME_SEEN_KEY } from "./welcome";

function AppShell() {
  const { isDark, colors } = useTheme();
  const { loading: authLoading } = useAuth();
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [exitingSplash, setExitingSplash] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), 1850);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(WELCOME_SEEN_KEY)
      .then((val) => {
        if (!mounted) return;
        setShouldShowWelcome(val !== "1");
        setWelcomeChecked(true);
      })
      .catch(() => {
        if (!mounted) return;
        setShouldShowWelcome(false);
        setWelcomeChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && minDelayDone && welcomeChecked && !exitingSplash && splashVisible) {
      const t = setTimeout(() => {
        if (shouldShowWelcome) {
          router.replace("/welcome");
        }
        setExitingSplash(true);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [authLoading, minDelayDone, welcomeChecked, shouldShowWelcome, exitingSplash, splashVisible]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
          animationDuration: 160,
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="traffic" options={{ animation: "fade" }} />
        <Stack.Screen name="planner" options={{ animation: "fade" }} />
        <Stack.Screen name="workspace" options={{ animation: "fade" }} />
        <Stack.Screen name="authority" options={{ animation: "fade" }} />
        <Stack.Screen
          name="report"
          options={{ animation: "slide_from_bottom", presentation: "transparentModal" }}
        />
        <Stack.Screen name="journeys" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="legal" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="auth/login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="auth/register" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: "slide_from_right" }} />
      </Stack>

      {splashVisible ? (
        <LogoAnimation
          exiting={exitingSplash}
          onExitComplete={() => setSplashVisible(false)}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
