import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Audio } from "expo-av";

interface Stop {
  id: string;
  order: number;
  title: string;
  lat: number;
  lng: number;
}

export default function ActiveTourScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [currentStop, setCurrentStop] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const soundRef = useRef<Audio.Sound | null>(null);

  // Placeholder stops - will come from API
  const stops: Stop[] = [
    { id: "1", order: 1, title: "City Hall", lat: 37.7749, lng: -122.4194 },
    { id: "2", order: 2, title: "Old Market", lat: 37.776, lng: -122.418 },
  ];

  useEffect(() => {
    setupLocation();
    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission denied");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);

    // Watch location for real-time updates
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation(newLocation);
        // TODO: Send location to WebSocket for party sync
        // TODO: Check if arrived at next stop
      }
    );
  };

  const setupAudio = async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  };

  const playNarration = async () => {
    // TODO: Get audio URL from API/WebSocket
    // For now, just toggle state
    setIsPlaying(true);

    // Placeholder - would load actual audio
    // const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
    // soundRef.current = sound;
    // await sound.playAsync();
  };

  const advanceToNext = () => {
    if (currentStop < stops.length - 1) {
      setCurrentStop(currentStop + 1);
      setIsPlaying(false);
      // TODO: Send advance signal via WebSocket
    }
  };

  const currentStopData = stops[currentStop];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: stops[0].lat,
          longitude: stops[0].lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={stop.title}
            pinColor={index === currentStop ? "#6366f1" : "#a0a0a0"}
          />
        ))}
        <Polyline
          coordinates={stops.map((s) => ({ latitude: s.lat, longitude: s.lng }))}
          strokeColor="#6366f1"
          strokeWidth={3}
        />
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.stopHeader}>
          <View style={styles.stopBadge}>
            <Text style={styles.stopBadgeText}>
              Stop {currentStop + 1}/{stops.length}
            </Text>
          </View>
          <Text style={styles.stopTitle}>{currentStopData?.title}</Text>
        </View>

        <View style={styles.controls}>
          {!isPlaying ? (
            <Pressable style={styles.playButton} onPress={playNarration}>
              <Text style={styles.playButtonText}>▶ Play Narration</Text>
            </Pressable>
          ) : (
            <View style={styles.playingIndicator}>
              <Text style={styles.playingText}>🎧 Playing...</Text>
            </View>
          )}

          <Pressable style={styles.nextButton} onPress={advanceToNext}>
            <Text style={styles.nextButtonText}>Next Stop →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  stopHeader: {
    marginBottom: 20,
  },
  stopBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    marginBottom: 8,
  },
  stopBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  stopTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  controls: {
    gap: 12,
  },
  playButton: {
    padding: 16,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    alignItems: "center",
  },
  playButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  playingIndicator: {
    padding: 16,
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    alignItems: "center",
  },
  playingText: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "bold",
  },
  nextButton: {
    padding: 16,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
