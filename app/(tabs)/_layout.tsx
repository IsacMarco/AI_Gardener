import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Pressable, Text, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Bot, Home, ShoppingBag, Sprout, UserRound } from "lucide-react-native";
import { useI18n } from "../../context/I18nContext";

// Define the standard icons for each route
const TAB_ICONS: Record<string, React.FC<any>> = {
  index: Home,
  myPlants: Sprout,
  aiHelper: Bot,
  marketplace: ShoppingBag,
  account: UserRound,
};

function TabBarButton({ route, isFocused, onPress, onLayout, label }: any) {
  const Icon = TAB_ICONS[route.name];
  
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
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{ 
            fontSize: 10,
            lineHeight: 11,
            fontWeight: "700", 
            marginTop: 4,
            maxWidth: 62,
            textAlign: "center",
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
  const { t } = useI18n();
  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });

  const tabLabels: Record<string, string> = {
    index: t("tabs.home"),
    myPlants: t("tabs.plants"),
    aiHelper: t("tabs.ai"),
    marketplace: t("tabs.market"),
    account: t("tabs.account"),
  };
  
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
              label={tabLabels[route.name]}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    // <PlantProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="myPlants" />
        <Tabs.Screen name="aiHelper" />
        <Tabs.Screen name="marketplace" />
        <Tabs.Screen name="account" />
        <Tabs.Screen name="plantDetails" options={{ href: null }} />
      </Tabs>
    // </PlantProvider>
  );
}