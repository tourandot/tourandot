import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Link, Redirect, router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import type { ActiveTourState } from "../src/lib/activeTour";
import { api } from "../src/lib/api";
import { useTheme, Theme } from "../src/theme";
import { activeTour } from "../src/lib/activeTour";

interface Tour {
  id: string;
  title: string;
  description: string;
  duration: string;
  stops: number;
  distance: string;
}

interface OngoingParty {
  code: string;
  tourId: string;
  joinMode: "open" | "pin";
  memberCount: number;
  createdAt: string;
  tour?: Tour;
}

type Tab = "tours" | "nearby";

export default function ToursScreen() {
  const { theme } = useTheme();
  const [existingTour, setExistingTour] = useState<ActiveTourState | null | undefined>(undefined);
  const [tours, setTours] = useState<Tour[]>([]);
  const [ongoingParties, setOngoingParties] = useState<OngoingParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("tours");

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState<OngoingParty | null>(null);
  const [pinInput, setPinInput] = useState("");

  // Check for active tour on mount
  useEffect(() => {
    activeTour.get().then((tour) => {
      setExistingTour(tour);
    });
  }, []);

  const loadTours = useCallback(async () => {
    const data = await api.getTours();
    setTours(data.tours);
  }, []);

  const loadOngoingParties = useCallback(async () => {
    try {
      const [partiesData, toursData] = await Promise.all([
        api.getOngoingParties(),
        api.getTours(),
      ]);

      const enrichedParties = partiesData.parties.map((party) => ({
        ...party,
        tour: toursData.tours.find((t) => t.id === party.tourId),
      }));

      setOngoingParties(enrichedParties);
    } catch (error) {
      console.error("Failed to load ongoing parties:", error);
    }
  }, []);

  // Load tours only when we know there's no active tour
  useEffect(() => {
    if (existingTour === undefined) return; // Still checking
    if (existingTour !== null) return; // Has active tour, will redirect

    // No active tour, load normally
    Promise.all([loadTours(), loadOngoingParties()]).then(() => {
      setLoading(false);
    });

    const interval = setInterval(loadOngoingParties, 5000);
    return () => clearInterval(interval);
  }, [existingTour, loadTours, loadOngoingParties]);

  const handleJoinParty = async (party: OngoingParty) => {
    if (party.joinMode === "pin") {
      setSelectedParty(party);
      setPinInput("");
      setPinModalVisible(true);
    } else {
      await joinPartyDirect(party.code, undefined, party);
    }
  };

  const joinPartyDirect = async (code: string, pin?: string, party?: OngoingParty) => {
    try {
      // Check if already on a tour
      const existing = await activeTour.get();
      if (existing) {
        Alert.alert(
          "Tour in Progress",
          "You're already on a tour. End it first to join another.",
          [{ text: "OK" }]
        );
        return;
      }

      const userId = "user-" + Math.random().toString(36).substring(7);
      await api.joinPartyWithPin(code, userId, "Guest", pin);

      await activeTour.set({
        code,
        tourId: party?.tourId || "",
        isHost: false,
        startedAt: new Date().toISOString(),
      });

      router.push(`/active/${code}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to join party");
    }
  };

  const handlePinSubmit = async () => {
    if (!selectedParty) return;
    setPinModalVisible(false);
    await joinPartyDirect(selectedParty.code, pinInput, selectedParty);
  };

  const styles = createStyles(theme);

  // Redirect to active tour if one exists
  if (existingTour) {
    return (
      <Redirect
        href={`/active/${existingTour.code}?host=${existingTour.isHost}&pin=${existingTour.pin || ""}`}
      />
    );
  }

  // Still checking for active tour or loading data
  if (existingTour === undefined || loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading tours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "tours" && styles.tabActive]}
          onPress={() => setActiveTab("tours")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "tours" && styles.tabTextActive,
            ]}
          >
            All Tours
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "nearby" && styles.tabActive]}
          onPress={() => setActiveTab("nearby")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "nearby" && styles.tabTextActive,
            ]}
          >
            Nearby
          </Text>
          {ongoingParties.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ongoingParties.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeTab === "tours" && (
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
      )}

      {activeTab === "nearby" && (
        <FlatList
          data={ongoingParties}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyTitle}>No tours nearby</Text>
              <Text style={styles.emptyDescription}>
                When someone starts a party tour near you, it will appear here
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleJoinParty(item)}>
              <View style={styles.nearbyHeader}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                {item.joinMode === "pin" && (
                  <Text style={styles.pinRequired}>PIN required</Text>
                )}
              </View>
              <Text style={styles.title}>
                {item.tour?.title || "Unknown Tour"}
              </Text>
              <Text style={styles.description}>
                {item.tour?.description || ""}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  {item.memberCount} {item.memberCount === 1 ? "person" : "people"}
                </Text>
                <Text style={styles.metaText}>Tap to join</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPinModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Enter PIN</Text>
            <Text style={styles.modalSubtitle}>
              Ask the host for the 4-digit PIN
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="0000"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButtonJoin,
                  pinInput.length !== 4 && styles.modalButtonDisabled,
                ]}
                onPress={handlePinSubmit}
                disabled={pinInput.length !== 4}
              >
                <Text style={styles.modalButtonJoinText}>Join</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loading: {
      color: theme.colors.text,
      textAlign: "center",
      marginTop: 50,
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weights.medium,
    },
    tabTextActive: {
      color: theme.colors.text,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.sm,
    },
    badgeText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
    },
    list: {
      padding: theme.spacing.lg,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.md,
    },
    meta: {
      flexDirection: "row",
      gap: theme.spacing.lg,
    },
    metaText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
    },
    nearbyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.successMuted,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.sm,
      gap: theme.spacing.sm,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.success,
    },
    liveText: {
      color: theme.colors.success,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.bold,
    },
    pinRequired: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.sizes.sm,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptyDescription: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      width: "80%",
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: "center",
      marginBottom: theme.spacing.sm,
    },
    modalSubtitle: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textMuted,
      textAlign: "center",
      marginBottom: theme.spacing.xl,
    },
    pinInput: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
      padding: theme.spacing.lg,
      fontSize: theme.typography.sizes.xxl,
      color: theme.colors.text,
      textAlign: "center",
      letterSpacing: 8,
      marginBottom: theme.spacing.xl,
    },
    modalButtons: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    modalButtonCancel: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceHover,
      alignItems: "center",
    },
    modalButtonCancelText: {
      color: theme.colors.text,
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.medium,
    },
    modalButtonJoin: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
    },
    modalButtonDisabled: {
      opacity: 0.5,
    },
    modalButtonJoinText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
    },
  });
