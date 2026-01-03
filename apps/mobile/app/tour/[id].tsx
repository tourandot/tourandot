import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../src/lib/api";
import { useTheme } from "../../src/theme";
import { activeTour } from "../../src/lib/activeTour";

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
type JoinMode = "open" | "pin";

export default function TourDetailsScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tour, setTour] = useState<TourDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrationStyle, setNarrationStyle] =
    useState<NarrationStyle>("balanced");
  const [partyMode, setPartyMode] = useState(false);
  const [joinMode, setJoinMode] = useState<JoinMode>("pin");
  const [pin, setPin] = useState(() => generatePin());

  function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const regeneratePin = () => {
    setPin(generatePin());
  };

  useEffect(() => {
    if (id) {
      api.getTour(id).then((data) => {
        setTour(data.tour);
        setLoading(false);
      });
    }
  }, [id]);

  const startTour = async () => {
    if (!tour) return;

    // Check if already on a tour
    const existing = await activeTour.get();
    if (existing) {
      Alert.alert(
        "Tour in Progress",
        "You're already on a tour. End it first to start a new one.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Tour",
            onPress: () => router.push(`/active/${existing.code}?host=${existing.isHost}&pin=${existing.pin || ""}`),
          },
        ]
      );
      return;
    }

    if (!partyMode) {
      // Solo tour
      const code = `solo-${tour.id}`;
      await activeTour.set({
        code,
        tourId: tour.id,
        isHost: true,
        startedAt: new Date().toISOString(),
      });
      router.push(`/active/${code}?host=true`);
      return;
    }

    try {
      const userId = "user-" + Math.random().toString(36).substring(7);
      const partyPin = joinMode === "pin" ? pin : undefined;

      const result = await api.createParty({
        tourId: tour.id,
        hostId: userId,
        hostName: "Host",
        config: { narrationStyle },
        joinMode,
        pin: partyPin,
      });

      await activeTour.set({
        code: result.code,
        tourId: tour.id,
        isHost: true,
        pin: partyPin,
        startedAt: new Date().toISOString(),
      });

      router.push(`/active/${result.code}?host=true&pin=${partyPin || ""}`);
    } catch (error) {
      Alert.alert("Error", "Failed to create party");
    }
  };

  const styles = createStyles(theme);

  if (loading || !tour) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <View style={styles.partyToggleRow}>
            <View style={styles.partyToggleLabel}>
              <Text style={styles.sectionTitle}>Party Mode</Text>
              <Text style={styles.partyDescription}>
                {partyMode ? "Others nearby can join" : "Solo tour"}
              </Text>
            </View>
            <Switch
              value={partyMode}
              onValueChange={setPartyMode}
              trackColor={{
                false: theme.colors.surfaceHover,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.text}
            />
          </View>

          {partyMode && (
            <View style={styles.joinModeContainer}>
              <Text style={styles.joinModeLabel}>Who can join?</Text>
              <Pressable
                style={[
                  styles.joinModeOption,
                  joinMode === "open" && styles.joinModeSelected,
                ]}
                onPress={() => setJoinMode("open")}
              >
                <View style={styles.radioOuter}>
                  {joinMode === "open" && <View style={styles.radioInner} />}
                </View>
                <View style={styles.joinModeText}>
                  <Text style={styles.joinModeTitle}>Anyone nearby</Text>
                  <Text style={styles.joinModeSubtitle}>
                    Open - no PIN required
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={[
                  styles.joinModeOption,
                  joinMode === "pin" && styles.joinModeSelected,
                ]}
                onPress={() => setJoinMode("pin")}
              >
                <View style={styles.radioOuter}>
                  {joinMode === "pin" && <View style={styles.radioInner} />}
                </View>
                <View style={styles.joinModeText}>
                  <Text style={styles.joinModeTitle}>PIN protected</Text>
                  <Text style={styles.joinModeSubtitle}>
                    Share PIN with your group
                  </Text>
                </View>
              </Pressable>

              {joinMode === "pin" && (
                <View style={styles.pinContainer}>
                  <Text style={styles.pinLabel}>Your PIN:</Text>
                  <View style={styles.pinInputRow}>
                    <TextInput
                      style={styles.pinInput}
                      value={pin}
                      onChangeText={(text) => setPin(text.replace(/[^0-9]/g, "").slice(0, 4))}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                    <Pressable style={styles.pinRefreshButton} onPress={regeneratePin}>
                      <Text style={styles.pinRefreshText}>↻</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.pinHint}>
                    Tell this PIN to friends who want to join
                  </Text>
                </View>
              )}
            </View>
          )}
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

        <View style={styles.buttonContainer}>
          <Pressable style={styles.startButton} onPress={startTour}>
            <Text style={styles.startButtonText}>Let's Go</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>["theme"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    loading: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.textMuted,
    },
    section: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    options: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    option: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
    },
    optionSelected: {
      backgroundColor: theme.colors.primary,
    },
    optionText: {
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weights.medium,
    },
    optionTextSelected: {
      color: theme.colors.textInverse,
    },
    stop: {
      flexDirection: "row",
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    stopNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stopNumberText: {
      color: theme.colors.textInverse,
      fontWeight: theme.typography.weights.bold,
    },
    stopInfo: {
      flex: 1,
    },
    stopTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    stopDescription: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textMuted,
    },
    buttonContainer: {
      padding: theme.spacing.lg,
    },
    startButton: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      alignItems: "center",
    },
    startButtonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
    },
    partyToggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    partyToggleLabel: {
      flex: 1,
    },
    partyDescription: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
    },
    joinModeContainer: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    joinModeLabel: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xs,
    },
    joinModeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 2,
      borderColor: "transparent",
      gap: theme.spacing.md,
    },
    joinModeSelected: {
      borderColor: theme.colors.primary,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    joinModeText: {
      flex: 1,
    },
    joinModeTitle: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
    },
    joinModeSubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
    },
    pinContainer: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
    },
    pinLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    pinInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    pinInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.sizes.xxl,
      color: theme.colors.text,
      textAlign: "center",
      letterSpacing: 8,
      fontWeight: theme.typography.weights.bold,
    },
    pinRefreshButton: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    pinRefreshText: {
      fontSize: 24,
      color: theme.colors.primary,
    },
    pinHint: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm,
      textAlign: "center",
    },
  });
