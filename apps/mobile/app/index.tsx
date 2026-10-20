import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TRAFFICSENSE</Text>
      <Text style={styles.title}>Understand traffic before you leave.</Text>
      <Text style={styles.body}>
        Report disruptions, review visible evidence, and choose a route with
        honest freshness and uncertainty labels.
      </Text>
      <View style={styles.actions}>
        <Link href="/report" style={styles.primary}>
          Report a problem
        </Link>
        <Link href="/traffic" style={styles.secondary}>
          View traffic
        </Link>
        <Link href="/auth/login" style={styles.secondary}>
          Sign in
        </Link>
      </View>
      <Text style={styles.note}>
        The mobile shell is ready. Authentication, reports, maps, and alerts
        will be connected in verified phases.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#f4f1ff",
  },
  eyebrow: {
    marginBottom: 14,
    color: "#5c4bb7",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    maxWidth: 360,
    color: "#17142b",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 43,
  },
  body: {
    marginTop: 18,
    maxWidth: 360,
    color: "#514d65",
    fontSize: 17,
    lineHeight: 26,
  },
  actions: {
    gap: 12,
    marginTop: 32,
  },
  primary: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#087f7b",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondary: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    color: "#087f7b",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  note: {
    marginTop: 28,
    color: "#6c687c",
    fontSize: 13,
    lineHeight: 19,
  },
});