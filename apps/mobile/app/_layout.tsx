import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/providers/auth-provider";
import { colors } from "../src/ui/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: "Sign in" }} />
        <Stack.Screen name="auth/register" options={{ title: "Create account" }} />
        <Stack.Screen name="workspace" options={{ title: "Workspace" }} />
        <Stack.Screen name="report" options={{ title: "Report a problem" }} />
        <Stack.Screen name="traffic" options={{ title: "Traffic" }} />
        <Stack.Screen name="traffic/[incidentId]" options={{ title: "Incident details" }} />
        <Stack.Screen name="planner" options={{ title: "Plan route" }} />
      </Stack>
    </AuthProvider>
  );
}
