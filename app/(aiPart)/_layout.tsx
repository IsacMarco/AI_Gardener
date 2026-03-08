import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function AiLayout() {

  return (
    <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animation: "fade",
          }}
        >
            <Stack.Screen name="aiChat" />
            <Stack.Screen name="aiIdentifier" />
            <Stack.Screen name="addPlant" />
            <Stack.Screen name="editPlant" />
        </Stack>
    </SafeAreaProvider>
  );
}
