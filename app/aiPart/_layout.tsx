import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PlantProvider } from "../../context/PlantContext";

export default function AiLayout() {

  return (
    <SafeAreaProvider>
      <PlantProvider>
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
        </Stack>
      </PlantProvider>
    </SafeAreaProvider>
  );
}
