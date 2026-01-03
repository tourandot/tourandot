import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Audio } from "expo-av";
import { activeTour } from "../../src/lib/activeTour";
import { api } from "../../src/lib/api";
import { NarrationStyle, NARRATION_STYLES, NARRATION_LABELS } from "../../src/lib/types";

interface Stop {
  id: string;
  order: number;
  title: string;
  lat: number;
  lng: number;
}

export default function ActiveTourScreen() {
  const { code, host, pin } = useLocalSearchParams<{
    code: string;
    host?: string;
    pin?: string;
  }>();
  const isHost = host === "true";
  const insets = useSafeAreaInsets();
  const [currentStop, setCurrentStop] = useState(0);
  const [memberCount, setMemberCount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>("balanced");
  const [moreFactsUsed, setMoreFactsUsed] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const soundRef = useRef<Audio.Sound | null>(null);
  const mapRef = useRef<MapView>(null);

  // Placeholder stops - will come from API
  const stops: Stop[] = [
    { id: "1", order: 1, title: "City Hall", lat: 37.7749, lng: -122.4194 },
    { id: "2", order: 2, title: "Old Market", lat: 37.776, lng: -122.418 },
  ];

  useEffect(() => {
    setupLocation();
    setupAudio();

    // Fit map to show all stops
    setTimeout(() => {
      if (mapRef.current && stops.length > 0) {
        mapRef.current.fitToCoordinates(
          stops.map((s) => ({ latitude: s.lat, longitude: s.lng })),
          { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
        );
      }
    }, 500);

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
      setMoreFactsUsed(false); // Reset for new stop
      // TODO: Send advance signal via WebSocket
    }
  };

  const triggerMoreFacts = () => {
    setMoreFactsUsed(true);
    // TODO: Request additional narration from API
    console.log("More facts requested for stop", currentStop + 1);
  };

  const cycleNarrationStyle = () => {
    const currentIndex = NARRATION_STYLES.indexOf(narrationStyle);
    const nextIndex = (currentIndex + 1) % NARRATION_STYLES.length;
    setNarrationStyle(NARRATION_STYLES[nextIndex]);
    // TODO: Send preference update via WebSocket
  };

  const currentStopData = stops[currentStop];

  const leaveTour = async () => {
    // Just clear local state and go home (don't end the party)
    await activeTour.clear();
    router.dismissAll();
    router.replace("/");
  };

  const endTour = async () => {
    // Read active tour state from AsyncStorage (source of truth)
    const tourState = await activeTour.get();
    const tourCode = tourState?.code || code;

    // Delete party from server if it's not a solo tour
    if (tourCode && !tourCode.startsWith("solo-")) {
      try {
        await api.endParty(tourCode);
      } catch (e) {
        console.log("Party delete error (ignored):", e);
      }
    }
    await activeTour.clear();
    router.dismissAll();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: stops[0].lat,
          longitude: stops[0].lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
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

      {/* Top bar with PIN badge */}
      <View style={[styles.topBar, { top: insets.top + 16 }]}>
        {isHost && pin && (
          <View style={styles.pinBadge}>
            <Text style={styles.pinBadgeLabel}>PIN</Text>
            <Text style={styles.pinBadgeValue}>{pin}</Text>
            <Text style={styles.pinBadgeMemberCount}>{memberCount} joined</Text>
          </View>
        )}
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 48 }]}>
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

          {isHost && (
            <View style={styles.hostControls}>
              <Pressable style={styles.narrationToggle} onPress={cycleNarrationStyle}>
                <Text style={styles.narrationToggleLabel}>Narration</Text>
                <Text style={styles.narrationToggleValue}>
                  {NARRATION_LABELS[narrationStyle]}
                </Text>
              </Pressable>

              {narrationStyle !== "verbose" && !moreFactsUsed && (
                <Pressable style={styles.moreFactsButton} onPress={triggerMoreFacts}>
                  <Text style={styles.moreFactsButtonText}>+ More Facts</Text>
                </Pressable>
              )}

              {moreFactsUsed && (
                <View style={styles.moreFactsUsed}>
                  <Text style={styles.moreFactsUsedText}>✓ Extra facts added</Text>
                </View>
              )}
            </View>
          )}

          <Pressable style={styles.nextButton} onPress={advanceToNext}>
            <Text style={styles.nextButtonText}>Next Stop →</Text>
          </Pressable>

          {isHost ? (
            <Pressable style={styles.endTourButton} onPress={endTour}>
              <Text style={styles.endTourButtonText}>End Tour</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.leaveTourButton} onPress={leaveTour}>
              <Text style={styles.leaveTourButtonText}>Leave Tour</Text>
            </Pressable>
          )}
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
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  pinBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  pinBadgeLabel: {
    color: "#a0a0a0",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  pinBadgeValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  pinBadgeMemberCount: {
    color: "#22c55e",
    fontSize: 11,
    marginTop: 4,
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
    zIndex: 10,
    elevation: 10,
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
  hostControls: {
    flexDirection: "row",
    gap: 10,
  },
  narrationToggle: {
    flex: 1,
    padding: 12,
    backgroundColor: "#2a2a3e",
    borderRadius: 10,
    alignItems: "center",
  },
  narrationToggleLabel: {
    color: "#a0a0a0",
    fontSize: 11,
    marginBottom: 2,
  },
  narrationToggleValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  moreFactsButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moreFactsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  moreFactsUsed: {
    flex: 1,
    padding: 12,
    backgroundColor: "#2a2a3e",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moreFactsUsedText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
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
  endTourButton: {
    padding: 14,
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
    marginTop: 4,
  },
  endTourButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  leaveTourButton: {
    padding: 14,
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a0a0a0",
    alignItems: "center",
    marginTop: 4,
  },
  leaveTourButtonText: {
    color: "#a0a0a0",
    fontSize: 16,
    fontWeight: "600",
  },
});
