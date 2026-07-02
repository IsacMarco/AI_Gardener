import "dotenv/config";

import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "AI Gardener",
  slug: "AI_Gardener",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "aigardener",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.marco.aigardener",
    googleServicesFile: "./googleService-Info.plist",
    // config: {
    //   googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    // },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E8E8E8",
      foregroundImage: "./assets/images/adaptive-foreground.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: "pan",
    package: "com.marco.aigardener",
    googleServicesFile: "./google-services.json",
    // config: {
    //   googleMaps: {
    //     apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    //   },
    // },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/logo.png",
        imageWidth: 180,
        backgroundColor: "#5F7A4B",
        dark: {
          backgroundColor: "#5F7A4B",
        },
      },
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
    "expo-speech-recognition",
    "@maplibre/maplibre-react-native",
    [
      "llama.rn",
      {
        "enableEntitlements": true,
      },
    ],
    "./plugins/withGgufAssets",
    "./plugins/withAssetCopy",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
