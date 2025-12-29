import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../src/lib/api";

interface Tour {
  id: string;
  title: string;
  description: string;
  duration: string;
  stops: number;
  distance: string;
}

export default function ToursScreen() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTours().then((data) => {
      setTours(data.tours);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading tours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/tour/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>{item.duration}</Text>
                <Text style={styles.metaText}>{item.stops} stops</Text>
                <Text style={styles.metaText}>{item.distance}</Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
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
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#a0a0a0",
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#6366f1",
  },
});
