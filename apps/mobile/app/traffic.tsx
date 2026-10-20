import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function TrafficScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Traffic" }} />
      <Text style={styles.title}>Traffic overview</Text>
      <Text style={styles.body}>
        Live incident data will use the existing Supabase-backed API. This
        screen currently shows no fabricated traffic state.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: "center" },
  title: { color: "#17142b", fontSize: 30, fontWeight: "800" },
  body: { marginTop: 14, color: "#514d65", fontSize: 17, lineHeight: 26 },
});
