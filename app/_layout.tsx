import React, { useEffect, useState } from "react";
import {
  FirebaseAuthTypes,
  onAuthStateChanged,
  getAuth,
} from "@react-native-firebase/auth";
import { Stack, useRouter, useSegments } from "expo-router";
import "./globals.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlantProvider } from "@/context/PlantContext";

const auth = getAuth();

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [usr, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const handleAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    return subscriber;
  }, []);

  useEffect(() => {
    if (initializing) return;
    const inProtectedGroup =
      segments[0] === "(tabs)" || segments[0] === "(aiPart)";

    if (usr && !inProtectedGroup) {
      router.replace("/(tabs)");
    } else if (!usr && inProtectedGroup) {
      router.replace("/");
    }
  }, [usr, initializing]);

  if (initializing) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PlantProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              animation: "fade",
            }}
          >
            <Stack.Protected guard={!!usr}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(aiPart)" />
            </Stack.Protected>
            <Stack.Protected guard={!usr}>
              <Stack.Screen name="index" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="forgotpass" />
            </Stack.Protected>
          </Stack>
        </PlantProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
