import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { useTheme } from "../src/theme";

function RootLayoutNav() {
  const { theme, themeName } = useTheme();

  return (
    <>
      <StatusBar style={themeName === "light" ? "dark" : "light"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider defaultTheme="dark">
        <RootLayoutNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
