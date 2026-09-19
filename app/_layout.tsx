import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { RecordingsProvider } from "@/lib/recordings-store";
import { ThemeProvider } from "@/lib/theme-provider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RecordingsProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="oauth/callback" options={{ headerShown: false }} />
        </Stack>
      </RecordingsProvider>
    </ThemeProvider>
  );
}
