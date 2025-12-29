import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../src/lib/api";

interface Stop {
  id: string;
  order: number;
  title: string;
  description: string;
}

interface TourDetails {
  id: string;
  title: string;
  description: string;
  duration: string;
  stops: Stop[];
}

type NarrationStyle = "verbose" | "quick" | "balanced";

export default function TourDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tour, setTour] = useState<TourDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrationStyle, setNarrationStyle] =
    useState<NarrationStyle>("balanced");

  useEffect(() => {
    if (id) {
      api.getTour(id).then((data) => {
        setTour(data.tour);
        setLoading(false);
      });
    }
  }, [id]);

  const startParty = async () => {
    if (!tour) return;

    try {
      // TODO: Get real user ID from auth
      const userId = "user-" + Math.random().toString(36).substring(7);
      const result = await api.createParty({
        tourId: tour.id,
        hostId: userId,
        hostName: "Host",
        config: { narrationStyle },
      });

      router.push(`/party/${result.code}`);
    } catch (error) {
      Alert.alert("Error", "Failed to create party");
    }
  };

  if (loading || !tour) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{tour.title}</Text>
        <Text style={styles.description}>{tour.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Narration Style</Text>
        <View style={styles.options}>
          {(["quick", "balanced", "verbose"] as const).map((style) => (
            <Pressable
              key={style}
              style={[
                styles.option,
                narrationStyle === style && styles.optionSelected,
              ]}
              onPress={() => setNarrationStyle(style)}
            >
              <Text
                style={[
                  styles.optionText,
                  narrationStyle === style && styles.optionTextSelected,
                ]}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stops ({tour.stops.length})</Text>
        {tour.stops.map((stop) => (
          <View key={stop.id} style={styles.stop}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{stop.order}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopTitle}>{stop.title}</Text>
              <Text style={styles.stopDescription}>{stop.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable style={styles.startButton} onPress={startParty}>
        <Text style={styles.startButtonText}>Start Party</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: 50,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#a0a0a0",
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a3e",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  options: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
  },
  optionSelected: {
    backgroundColor: "#6366f1",
  },
  optionText: {
    color: "#a0a0a0",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#fff",
  },
  stop: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  stopNumberText: {
    color: "#fff",
    fontWeight: "bold",
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  stopDescription: {
    fontSize: 14,
    color: "#a0a0a0",
  },
  startButton: {
    margin: 16,
    padding: 16,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
