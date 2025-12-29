import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1a1a2e",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Tours" }} />
        <Stack.Screen name="tour/[id]" options={{ title: "Tour Details" }} />
        <Stack.Screen name="party/[code]" options={{ title: "Party Lobby" }} />
        <Stack.Screen
          name="active/[code]"
          options={{ title: "Tour", headerShown: false }}
        />
      </Stack>
    </>
  );
}
