import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return <Stack
    screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
      }}
  >
    <Stack.Screen name="index"/>
    <Stack.Screen name="signup"/>
    <Stack.Screen name="forgotpass" />
    <Stack.Screen name="(tabs)" />
  </Stack>;
}
