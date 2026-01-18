import React, { useEffect, useState } from "react";
// 1. Modificăm importul pentru a folosi varianta modulară
import auth, { FirebaseAuthTypes, onAuthStateChanged } from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from "expo-router";
import './globals.css';

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
    const subscriber = onAuthStateChanged(auth(), handleAuthStateChanged);
    return subscriber;
  }, []);
  
  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === "(tabs)";
    if (usr && !inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!usr && inAuthGroup) {
      router.replace("/");
    }
  }, [usr, initializing]);

  if (initializing) return null; 

  return (
    <Stack
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
      }}
    >
      <Stack.Protected guard={!!usr}>
        <Stack.Screen name="(tabs)"/>
      </Stack.Protected>
      <Stack.Protected guard={!usr}>
        <Stack.Screen name="index"/>
        <Stack.Screen name="signup"/>
        <Stack.Screen name="forgotpass" />
      </Stack.Protected>
    </Stack>
  );
}