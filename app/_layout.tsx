import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return <Stack
    screenOptions={{ 
        headerShown: false,
        gestureEnabled: false
      }}
  >
    <Stack.Screen name="index"
    options={{
      animation: 'fade'
    }}
    />
    <Stack.Screen name="signup"
    options={{
        animation: 'slide_from_right'
      }}
    />
    <Stack.Screen name="forgotpass" />
    <Stack.Screen name="(tabs)" />
  </Stack>;
}
