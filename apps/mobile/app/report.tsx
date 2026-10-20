import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Report" }} />
      <Text style={styles.title}>Report a problem</Text>
      <Text style={styles.body}>
        Reporting will be connected after the mobile authentication and API
        contract checks pass. No location permission has been requested.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: "center" },
  title: { color: "#17142b", fontSize: 30, fontWeight: "800" },
  body: { marginTop: 14, color: "#514d65", fontSize: 17, lineHeight: 26 },
});
