import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Pressable, Text, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Bot, Home, ShoppingBag, Sprout, UserRound } from "lucide-react-native";
import { PlantProvider } from "../../context/PlantContext";

// Define the standard icons for each route
const TAB_ICONS: Record<string, React.FC<any>> = {
  index: Home,
  myPlants: Sprout,
  aiHelper: Bot,
  marketplace: ShoppingBag,
  account: UserRound,
};

// Map route names to display labels
const TAB_LABELS: Record<string, string> = {
  index: "Home",
  myPlants: "Plants",
  aiHelper: "AI",
  marketplace: "Market",
  account: "Account",
};

function TabBarButton({ route, isFocused, onPress, onLayout }: any) {
  const Icon = TAB_ICONS[route.name];
  const label = TAB_LABELS[route.name];
  
  if (!Icon) return null; // Skip hidden screens

  // Removed all individual reanimated values here to fix lag.
  // State changes are now instant and lightweight.
  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", zIndex: 2 }}
    >
      <View style={{ alignItems: "center" }}>
        <Icon size={22} color={isFocused ? "#FFFFFF" : "#8C8673"} />
        <Text
          style={{ 
            fontSize: 10, 
            fontWeight: "700", 
            marginTop: 4,
            color: isFocused ? "#FFFFFF" : "#8C8673"
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });
  
  // Calculate the width of a single tab dynamically based on visible routes
  const visibleRoutesCount = state.routes.filter((r: any) => TAB_ICONS[r.name]).length;
  const buttonWidth = dimensions.width / (visibleRoutesCount || 1);

  // Track the physical X position of the sliding green indicator
  const tabPositionX = useSharedValue(0);

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  useEffect(() => {
    const visibleRoutes = state.routes.filter((r: any) => TAB_ICONS[r.name]);
    const activeVisibleIndex = visibleRoutes.findIndex((r: any) => r.name === state.routes[state.index].name);
    
    if (activeVisibleIndex !== -1) {
      // This is now the ONLY animation running, making it perfectly smooth
      tabPositionX.value = withSpring(buttonWidth * activeVisibleIndex, {
        damping: 25,
        stiffness: 250,
        mass: 0.5,
      });
    }
  }, [state.index, buttonWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPositionX.value }],
  }));

  return (
    <View
      style={{
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: "#FCFCFA",
        borderRadius: 40,
        height: 72,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 10,
        justifyContent: "center",
      }}
      onLayout={onTabbarLayout}
    >
      {/* The single sliding background indicator */}
      <Animated.View
        style={[
          {
            position: "absolute",
            backgroundColor: "#5F7A4B",
            borderRadius: 30,
            height: 56,
            width: buttonWidth - 16, // Margins keep it from touching adjacent tabs
            marginHorizontal: 8,
            zIndex: 1,
            shadowColor: "#5F7A4B",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
          },
          animatedIndicatorStyle,
        ]}
      />

      <View style={{ flexDirection: "row", flex: 1 }}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          if (!TAB_ICONS[route.name]) return null;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabBarButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <PlantProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="myPlants" />
        <Tabs.Screen name="aiHelper" />
        <Tabs.Screen name="marketplace" />
        <Tabs.Screen name="account" />
        {/* Hidden routes that don't need a tab bar icon */}
        {/* <Tabs.Screen name="addPlant" options={{ href: null, tabBarStyle: { display: "none" }, }} /> */}
        <Tabs.Screen name="plantDetails" options={{ href: null }} />
        <Tabs.Screen name="editPlant" options={{ href: null }} />
      </Tabs>
    </PlantProvider>
  );
}