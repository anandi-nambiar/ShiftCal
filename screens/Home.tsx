// components/Home.tsx
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { saveCalendarFeed } from "../utils/calendar";
import { syncShiftsForUser } from "../utils/ics";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function connect() {
    const cleanUrl = url.trim();

    if (!cleanUrl.startsWith("http")) {
      Alert.alert("Invalid link", "Please paste a valid calendar URL.");
      return;
    }

    setLoading(true);

    try {
      await saveCalendarFeed(cleanUrl);
      const syncedCount = await syncShiftsForUser();

      Alert.alert(
        "Roster connected",
        `${syncedCount} shifts were successfully added.`
      );

      setUrl("");
    } catch (err: any) {
      Alert.alert(
        "Connection failed",
        err.message?.includes("Failed to parse ICS")
          ? "This calendar link isn’t supported. Please double-check the URL."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Connect your roster</Text>
        <Text style={styles.subtitle}>
          Import your work shifts automatically using your roster calendar.
        </Text>
      </View>

      {/* Input Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Calendar link</Text>

        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://your-roster-link.ics"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (loading || !url) && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed,
          ]}
          onPress={connect}
          disabled={loading || !url}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect roster</Text>
          )}
        </Pressable>
      </View>

      {/* Help Section */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Where do I find this?</Text>

        <HelpItem
          title="Deputy"
          text="Profile → My profile → Sync calendar → Copy iCal link"
        />

        <HelpItem
          title="Humanforce"
          text="Employee portal → My roster → Export / Subscribe"
        />

        <HelpItem
          title="FoundU"
          text="Profile → Calendar → Subscribe → Copy iCal URL"
        />

        <Text style={styles.helpFooter}>
          This is the same link you’d use with Google Calendar or Outlook.
        </Text>
      </View>
    </ScrollView>
  );
}

/* Reusable help row */
function HelpItem({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.helpItem}>
      <Text style={styles.helpItemTitle}>{title}</Text>
      <Text style={styles.helpItemText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f6f8",
    padding: 20,
    justifyContent: "center",
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },

  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#607AFB",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  helpCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },

  helpTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },

  helpItem: {
    marginBottom: 12,
  },

  helpItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  helpItemText: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 18,
  },

  helpFooter: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
  },
});
