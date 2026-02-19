import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { MapPin, Search, ShoppingBag, Star, Leaf } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_REGION = {
  latitude: 44.4268,
  longitude: 26.1025,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const RADIUS_OPTIONS = [1000, 2500, 5000, 8000];
const MAX_RADIUS = Math.max(...RADIUS_OPTIONS);

type NearbyShop = {
  id: string;
  name: string;
  rating?: number | null;
  vicinity?: string | null;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceKm?: number | null;
};

type ShopCategory = {
  id: string;
  label: string;
  keyword: string;
};

const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "plants",
    label: "Plant Shops",
    keyword: "garden center nursery plant shop florist greenhouse",
  },
  {
    id: "tools",
    label: "Garden Tools",
    keyword: "garden tools hardware lawn mower pruning shears",
  },
  {
    id: "care",
    label: "Plant Care",
    keyword: "fertilizer soil compost irrigation pesticides",
  },
  {
    id: "landscaping",
    label: "Landscaping",
    keyword: "landscaping garden design outdoor living",
  },
];

const PRODUCTS = [
  {
    id: "1",
    name: "Organic Potting Mix",
    price: "29.99",
    unit: "20L",
    rating: 4.8,
    badge: "Best seller",
  },
  {
    id: "2",
    name: "Indoor Herb Kit",
    price: "59.00",
    unit: "set",
    rating: 4.6,
    badge: "Starter",
  },
  {
    id: "3",
    name: "Drip Irrigation Set",
    price: "89.50",
    unit: "12 pcs",
    rating: 4.7,
    badge: "New",
  },
  {
    id: "4",
    name: "Ceramic Planter",
    price: "24.00",
    unit: "20cm",
    rating: 4.4,
    badge: "Decor",
  },
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [allShopsByCategory, setAllShopsByCategory] = useState<
    Record<string, NearbyShop[]>
  >({});
  const [shopsByCategory, setShopsByCategory] = useState<
    Record<string, NearbyShop[]>
  >({});
  const [activeCategories, setActiveCategories] = useState<
    Record<string, boolean>
  >(() =>
    SHOP_CATEGORIES.reduce<Record<string, boolean>>((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {}),
  );
  const [loadingShops, setLoadingShops] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(RADIUS_OPTIONS[1]);
  const [lastCoords, setLastCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [activeTab, setActiveTab] = useState<"shops" | "products">("shops");
  const [locationDenied, setLocationDenied] = useState(false);
  const [gpsDisabled, setGpsDisabled] = useState(false); // New state added
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(() =>
    SHOP_CATEGORIES.reduce<Record<string, boolean>>((acc, category) => {
      acc[category.id] = false;
      return acc;
    }, {}),
  );
  const [selectedShop, setSelectedShop] = useState<NearbyShop | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const getDistanceKm = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const deltaLat = toRad(to.latitude - from.latitude);
    const deltaLon = toRad(to.longitude - from.longitude);
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.sin(deltaLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const showErrorModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const applyRadiusFilter = (
    sourceByCategory: Record<string, NearbyShop[]>,
    radius: number,
  ) => {
    const radiusKm = radius / 1000;
    const filteredByCategory: Record<string, NearbyShop[]> = {};
    const combinedMap = new Map<string, NearbyShop>();
    let hasAnyResults = false;

    SHOP_CATEGORIES.forEach((category) => {
      if (!activeCategories[category.id]) {
        filteredByCategory[category.id] = [];
        return;
      }
      const source = sourceByCategory[category.id] || [];
      const filtered = source.filter(
        (shop) => shop.distanceKm == null || shop.distanceKm <= radiusKm,
      );
      filteredByCategory[category.id] = filtered;
      if (filtered.length > 0) {
        hasAnyResults = true;
      }
      filtered.forEach((shop) => {
        combinedMap.set(shop.id, shop);
      });
    });

    setShopsByCategory(filteredByCategory);
    setShops(Array.from(combinedMap.values()));
    setNoResults(!hasAnyResults);
  };

  const toggleCategory = (categoryId: string) => {
    setActiveCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const openMapsDirections = async () => {
    if (!selectedShop) return;
    const destination = `${selectedShop.location.latitude},${selectedShop.location.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn("Cannot open maps URL.");
      }
    } catch (error) {
      console.error("Open maps error:", error);
    }
  };

  const fetchCategoryShops = async (
    coords: { latitude: number; longitude: number },
    category: ShopCategory,
    searchRadius: number,
  ) => {
    if (!apiKey) {
      throw new Error("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.");
    }

    const keywordParam = encodeURIComponent(category.keyword);
    const url =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json" +
      `?location=${coords.latitude},${coords.longitude}` +
      `&radius=${searchRadius}` +
      "&type=store" +
      `&keyword=${keywordParam}` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return [];
    }

    if (data.status !== "OK") {
      throw new Error(
        data.error_message || `Places API status: ${data.status}`,
      );
    }

    return data.results.map((item: any) => {
      const distanceKm = getDistanceKm(coords, {
        latitude: item.geometry.location.lat,
        longitude: item.geometry.location.lng,
      });

      return {
        id: item.place_id,
        name: item.name,
        rating: item.rating ?? null,
        vicinity: item.vicinity ?? null,
        location: {
          latitude: item.geometry.location.lat,
          longitude: item.geometry.location.lng,
        },
        distanceKm,
      } as NearbyShop;
    });
  };

  const loadNearbyShops = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    if (!apiKey) {
      console.error("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.");
      showErrorModal(
        "Maps key missing",
        "Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to load nearby shops.",
      );
      return;
    }

    setLoadingShops(true);
    try {
      setNoResults(false);
      const results = await Promise.allSettled(
        SHOP_CATEGORIES.map((category) =>
          fetchCategoryShops(coords, category, MAX_RADIUS),
        ),
      );

      const nextByCategory: Record<string, NearbyShop[]> = {};

      results.forEach((result, index) => {
        const category = SHOP_CATEGORIES[index];
        if (result.status === "fulfilled") {
          nextByCategory[category.id] = result.value;
        } else {
          console.error(`Places API error (${category.label}):`, result.reason);
          nextByCategory[category.id] = [];
        }
      });

      setAllShopsByCategory(nextByCategory);
      applyRadiusFilter(nextByCategory, radiusMeters);
    } catch (error) {
      console.error("Nearby shops error:", error);
      showErrorModal(
        "Network error",
        "Unable to load nearby shops. Try again later.",
      );
    } finally {
      setLoadingShops(false);
    }
  };

  // Reusable loader so we can call it from buttons (Refresh)
  const loadLocationAsync = async () => {
    try {
      // Check whether permission is already granted (no prompt)
      const currentPermission = await Location.getForegroundPermissionsAsync();
      if (!currentPermission.granted) {
        setLocationDenied(true);
        return;
      }

      // Check whether device location services (GPS) are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.warn("Location services are disabled.");
        setGpsDisabled(true);
        return;
      }

      setLocationDenied(false);
      setGpsDisabled(false);

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const nextRegion = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };

      setRegion(nextRegion);
      setLastCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      await loadNearbyShops({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error("Location error:", error);
      // don't show modal for generic location errors here; keep console for debugging
    }
  };

  // Called when user taps Refresh: this will request permission (prompts if needed)
  const handleRefresh = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationDenied(true);
        return;
      }

      setLocationDenied(false);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setGpsDisabled(true);
        return;
      }

      setGpsDisabled(false);

      // Now fetch current position and shops
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextRegion = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      };

      setRegion(nextRegion);
      setLastCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });

      await loadNearbyShops({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error) {
      console.error("Refresh location error:", error);
    }
  };

  useEffect(() => {
    loadLocationAsync();
  }, []);

  const isLocationModal =
    modalTitle?.toLowerCase().includes("location") ||
    modalTitle?.toLowerCase().includes("permission");

  useEffect(() => {
    if (Object.keys(allShopsByCategory).length > 0) {
      applyRadiusFilter(allShopsByCategory, radiusMeters);
    }
  }, [radiusMeters, allShopsByCategory, activeCategories]);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-2 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="w-10 h-10" />
        </View>
        <View className="items-center mt-4 mb-6">
          <Text className="text-3xl font-bold text-white tracking-wider">
            Marketplace
          </Text>
          <Text className="text-white/80 mt-2">
            Find nearby shops and garden essentials
          </Text>
        </View>

        <View className="px-5 mb-4">
          <View className="bg-white/90 rounded-full p-1 flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab("shops")}
              className={`flex-1 py-2 rounded-full items-center ${
                activeTab === "shops" ? "bg-[#5F7A4B]" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "shops" ? "text-white" : "text-[#1F2937]"
                }`}
              >
                Shops
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("products")}
              className={`flex-1 py-2 rounded-full items-center ${
                activeTab === "products" ? "bg-[#5F7A4B]" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === "products" ? "text-white" : "text-[#1F2937]"
                }`}
              >
                Products
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mb-4">
          <View className="bg-white/90 flex-row items-center px-4 rounded-2xl shadow-sm">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder={
                activeTab === "shops" ? "Search shops" : "Search products"
              }
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-base text-[#1F2937]"
            />
          </View>
        </View>

        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-5 pt-8 pb-6">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {activeTab === "shops" ? (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-[#1F2937]">Shops Nearby</Text>
                  {!locationDenied && !gpsDisabled && (
                    <TouchableOpacity onPress={() => handleRefresh()} className="flex-row items-center bg-white/90 px-3 py-2 rounded-full">
                      <Ionicons name="refresh" size={16} color="#5F7A4B" />
                      <Text className="ml-2 text-sm font-semibold text-[#5F7A4B]">Refresh</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {locationDenied || gpsDisabled ? (
                  <View className="bg-white/90 rounded-2xl p-6 items-center shadow-sm">
                    <View className="w-14 h-14 rounded-full bg-[#5F7A4B]/10 items-center justify-center mb-3">
                      <Ionicons name="location" size={26} color="#5F7A4B" />
                    </View>
                    <Text className="text-base font-semibold text-[#1F2937] mb-2 text-center">
                      {locationDenied ? "Location permission needed" : "Location services disabled"}
                    </Text>
                    <Text className="text-sm text-gray-500 text-center mb-4">
                      {locationDenied
                        ? "Enable location access to show your position and nearby shops."
                        : "Turn on your device's location (GPS) to see nearby shops."}
                    </Text>
                    <View className="w-full flex-row justify-center">
                      <TouchableOpacity
                        onPress={() => Linking.openSettings()}
                        className="bg-[#5F7A4B] px-5 py-2.5 rounded-full mr-3"
                      >
                        <Text className="text-white font-semibold">Open Settings</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRefresh()}
                        className="bg-white/80 px-5 py-2.5 rounded-full border border-gray-200"
                      >
                        <Text className="text-[#1F2937] font-semibold">Refresh</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View className="rounded-2xl overflow-hidden border border-white/60 shadow-sm mb-4">
                      <MapView
                        style={{ height: 220, width: "100%" }}
                        region={region}
                        showsUserLocation
                        showsMyLocationButton
                      >
                        {shops.map((shop: NearbyShop) => (
                          <Marker
                            key={shop.id}
                            coordinate={shop.location}
                            title={shop.name}
                            description={shop.vicinity || "Nearby shop"}
                          />
                        ))}
                      </MapView>
                    </View>

                    <View className="mb-6">
                      <Text className="text-sm font-semibold text-[#1F2937] mb-2">
                        Search radius
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {RADIUS_OPTIONS.map((option) => {
                          const isActive = option === radiusMeters;
                          return (
                            <TouchableOpacity
                              key={option}
                              onPress={() => setRadiusMeters(option)}
                              className={`px-4 py-2 rounded-full border ${
                                isActive
                                  ? "bg-[#5F7A4B] border-[#5F7A4B]"
                                  : "bg-white/80 border-white/60"
                              }`}
                            >
                              <Text
                                className={`text-sm font-semibold ${
                                  isActive ? "text-white" : "text-[#1F2937]"
                                }`}
                              >
                                {option / 1000} km
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View className="mb-6">
                      <Text className="text-sm font-semibold text-[#1F2937] mb-2">
                        Categories
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {SHOP_CATEGORIES.map((category) => {
                          const isActive = activeCategories[category.id];
                          return (
                            <TouchableOpacity
                              key={category.id}
                              onPress={() => toggleCategory(category.id)}
                              className={`px-3 py-2 rounded-full border ${
                                isActive
                                  ? "bg-[#5F7A4B] border-[#5F7A4B]"
                                  : "bg-white/80 border-white/60"
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  isActive ? "text-white" : "text-[#1F2937]"
                                }`}
                              >
                                {category.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View className="mb-8">
                      {loadingShops ? (
                        <View className="items-center py-6">
                          <ActivityIndicator size="small" color="#5F7A4B" />
                          <Text className="text-sm text-gray-500 mt-2">
                            Loading nearby shops...
                          </Text>
                        </View>
                      ) : noResults ? (
                        <View className="items-center py-6">
                          <Text className="text-sm text-center text-gray-500">
                            No garden-related shops were found in this area. Try
                            expanding your search radius or enabling more
                            categories.
                          </Text>
                        </View>
                      ) : (
                        SHOP_CATEGORIES.filter(
                          (category) => activeCategories[category.id],
                        ).map((category) => {
                          const isExpanded = expandedCategories[category.id];
                          const resultCount =
                            shopsByCategory[category.id]?.length ?? 0;
                          return (
                            <View key={category.id} className="mb-4">
                              <TouchableOpacity
                                onPress={() =>
                                  toggleCategoryExpanded(category.id)
                                }
                                className="bg-white/90 rounded-2xl px-4 py-3 shadow-sm flex-row items-center justify-between"
                              >
                                <View>
                                  <Text className="text-base font-semibold text-[#1F2937]">
                                    {category.label}
                                  </Text>
                                  <Text className="text-xs text-gray-500 mt-1">
                                    {resultCount} results
                                  </Text>
                                </View>
                                <Ionicons
                                  name={
                                    isExpanded ? "chevron-up" : "chevron-down"
                                  }
                                  size={20}
                                  color="#6B7280"
                                />
                              </TouchableOpacity>

                              {isExpanded && resultCount > 0 && (
                                <View className="mt-3">
                                  {(shopsByCategory[category.id] || [])
                                    .slice(0, 6)
                                    .map((shop: NearbyShop) => (
                                      <TouchableOpacity
                                        key={shop.id}
                                        onPress={() => {
                                          setSelectedShop(shop);
                                          setMapModalVisible(true);
                                        }}
                                        className="flex-row items-center justify-between bg-white/70 rounded-2xl px-4 py-3 mb-3 shadow-sm"
                                      >
                                        <View className="flex-row items-center">
                                          <View className="w-10 h-10 rounded-full bg-[#5F7A4B]/15 items-center justify-center mr-3">
                                            <ShoppingBag
                                              size={20}
                                              color="#5F7A4B"
                                            />
                                          </View>
                                          <View>
                                            <Text className="text-base font-semibold text-[#1F2937]">
                                              {shop.name}
                                            </Text>
                                            <Text className="text-sm text-gray-500">
                                              {shop.vicinity || "Nearby"}
                                            </Text>
                                          </View>
                                        </View>
                                        <View className="items-end">
                                          <View className="flex-row items-center">
                                            <Star size={14} color="#F59E0B" />
                                            <Text className="ml-1 text-sm text-[#1F2937]">
                                              {shop.rating?.toFixed(1) ?? "-"}
                                            </Text>
                                          </View>
                                          {shop.distanceKm ? (
                                            <Text className="text-xs text-gray-500 mt-1">
                                              {shop.distanceKm.toFixed(1)} km
                                            </Text>
                                          ) : null}
                                        </View>
                                      </TouchableOpacity>
                                    ))}
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  </>
                )}
              </>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-[#1F2937]">
                    Popular Products
                  </Text>
                  <TouchableOpacity className="flex-row items-center">
                    <Text className="text-[#5F7A4B]">See all</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap justify-between">
                  {PRODUCTS.map((product) => (
                    <View
                      key={product.id}
                      className="w-[48%] bg-white/95 rounded-2xl p-4 mb-4 shadow-sm"
                    >
                      <View className="bg-[#EEF3E7] h-24 rounded-xl mb-3 items-center justify-center">
                        <ShoppingBag size={28} color="#5F7A4B" />
                      </View>
                      <Text className="text-sm font-semibold text-[#1F2937]">
                        {product.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {product.unit}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Star size={12} color="#F59E0B" />
                        <Text className="ml-1 text-xs text-[#1F2937]">
                          {product.rating}
                        </Text>
                        <View className="ml-2 bg-[#5F7A4B]/10 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] text-[#5F7A4B]">
                            {product.badge}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between mt-3">
                        <Text className="text-base font-bold text-[#1F2937]">
                          ${product.price}
                        </Text>
                        <TouchableOpacity className="bg-[#5F7A4B] px-3 py-1.5 rounded-full">
                          <Text className="text-xs text-white font-semibold">
                            Buy
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="justify-center items-center px-6"
        >
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl">
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <Leaf size={32} color="#5F7A4B" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-1 text-center">{modalTitle}</Text>
            <Text className="text-gray-500 text-sm mb-6 font-medium text-center">{modalMessage}</Text>

            {isLocationModal ? (
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity onPress={() => Linking.openSettings()} className="flex-1 bg-white/80 py-3 rounded-xl items-center border border-gray-200">
                  <Text className="text-[#1F2937] font-semibold">Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setModalVisible(false); handleRefresh(); }} className="flex-1 bg-[#5F7A4B] py-3 rounded-xl items-center">
                  <Text className="text-white font-semibold">Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setModalVisible(false)} className="mt-2 bg-[#5F7A4B] py-3 rounded-xl w-full items-center">
                <Text className="text-white font-semibold">OK</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={mapModalVisible} animationType="fade" onRequestClose={() => setMapModalVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setMapModalVisible(false)}
          className="justify-center items-center px-6"
        >
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl">
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <MapPin size={32} color="#5F7A4B" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-1 text-center">Open in Maps?</Text>
            <Text className="text-gray-500 text-sm mb-4 font-medium text-center">{selectedShop?.name || "Selected shop"}{"\n"}Do you want directions to this location?</Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity onPress={() => setMapModalVisible(false)} className="flex-1 bg-white/80 py-3 rounded-xl items-center border border-gray-200">
                <Text className="text-[#1F2937] font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setMapModalVisible(false); openMapsDirections(); }} className="flex-1 bg-[#5F7A4B] py-3 rounded-xl items-center">
                <Text className="text-white font-semibold">Open Maps</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
