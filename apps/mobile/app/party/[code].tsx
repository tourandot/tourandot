import { View, Text, Pressable, StyleSheet, Share } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../src/lib/api";

interface Member {
  id: string;
  name: string;
  ready: boolean;
}

interface Party {
  code: string;
  tourId: string;
  hostId: string;
  members: Member[];
  status: "lobby" | "active" | "completed";
}

export default function PartyLobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId] = useState(
    () => "user-" + Math.random().toString(36).substring(7)
  );

  useEffect(() => {
    if (code) {
      loadParty();
      // TODO: Set up WebSocket for real-time updates
    }
  }, [code]);

  const loadParty = async () => {
    if (!code) return;
    const data = await api.getParty(code);
    setParty(data.party);
    setLoading(false);
  };

  const shareInvite = async () => {
    if (!code) return;
    await Share.share({
      message: `Join my walking tour! Open this link: tourandot://party/${code}`,
    });
  };

  const markReady = async () => {
    if (!code) return;
    await api.markReady(code, userId);
    loadParty();
  };

  const startTour = () => {
    if (!code) return;
    // TODO: Send WebSocket message to start tour
    router.replace(`/active/${code}`);
  };

  if (loading || !party) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading party...</Text>
      </View>
    );
  }

  const isHost = party.hostId === userId;
  const allReady = party.members.every((m) => m.ready);
  const currentMember = party.members.find((m) => m.id === userId);

  return (
    <View style={styles.container}>
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Party Code</Text>
        <Text style={styles.code}>{party.code}</Text>
        <Pressable style={styles.shareButton} onPress={shareInvite}>
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </Pressable>
      </View>

      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>
          Party Members ({party.members.length})
        </Text>
        {party.members.map((member) => (
          <View key={member.id} style={styles.member}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.name} {member.id === party.hostId && "(Host)"}
              </Text>
            </View>
            <View
              style={[
                styles.readyBadge,
                member.ready && styles.readyBadgeActive,
              ]}
            >
              <Text style={styles.readyBadgeText}>
                {member.ready ? "Ready" : "Waiting"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {!currentMember?.ready && (
          <Pressable style={styles.readyButton} onPress={markReady}>
            <Text style={styles.readyButtonText}>I'm Ready</Text>
          </Pressable>
        )}

        {isHost && (
          <Pressable
            style={[styles.startButton, !allReady && styles.startButtonDisabled]}
            onPress={startTour}
            disabled={!allReady}
          >
            <Text style={styles.startButtonText}>
              {allReady ? "Start Tour" : "Waiting for everyone..."}
            </Text>
          </Pressable>
        )}
      </View>
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
  codeSection: {
    alignItems: "center",
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  codeLabel: {
    fontSize: 14,
    color: "#a0a0a0",
    marginBottom: 8,
  },
  code: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6366f1",
    letterSpacing: 4,
    marginBottom: 16,
  },
  shareButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  membersSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  member: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: "#fff",
  },
  readyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#2a2a3e",
  },
  readyBadgeActive: {
    backgroundColor: "#22c55e",
  },
  readyBadgeText: {
    fontSize: 12,
    color: "#fff",
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  readyButton: {
    padding: 16,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    alignItems: "center",
  },
  readyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  startButton: {
    padding: 16,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#3a3a4e",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
