import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { MapPin, Search, ShoppingBag, Star, Leaf } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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
  relevanceScore?: number;
  categoryIds?: string[]; // NEW: ca să putem filtra corect per categorie
};

type CategoryRule = {
  key: string;
  values: string[];
  weight: number;
};

type ShopCategory = {
  id: string;
  label: string;
  keyword?: string;
  include: CategoryRule[];
  exclude?: CategoryRule[];
};

type OSMElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OSMElement[];
};

const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "plants",
    label: "Plant Shops",
    include: [
      { key: "shop", values: ["garden_centre", "florist", "plant_nursery"], weight: 6 },
      { key: "landuse", values: ["plant_nursery"], weight: 3 },
    ],
    exclude: [{ key: "amenity", values: ["grave_yard"], weight: 10 }],
  },
  {
    id: "tools",
    label: "Garden Tools",
    include: [
      { key: "shop", values: ["hardware", "doityourself", "tools"], weight: 6 },
      { key: "shop", values: ["trade", "rental"], weight: 3 },
    ],
  },
  {
    id: "care",
    label: "Plant Care",
    include: [
      { key: "shop", values: ["agrarian", "farm"], weight: 6 },
      { key: "product", values: ["fertilizer", "pesticide"], weight: 4 },
    ],
  },
  {
    id: "landscaping",
    label: "Landscaping",
    include: [
      { key: "craft", values: ["gardener", "landscaper", "tree_surgeon"], weight: 7 },
      { key: "office", values: ["landscape_architect"], weight: 5 },
      { key: "service", values: ["landscaper", "gardener"], weight: 6 },
      { key: "trade", values: ["landscaping", "horticulture"], weight: 6 },
    ],
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

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const CATEGORY_CONFIDENCE_THRESHOLD = 5;
const GLOBAL_CONFIDENCE_THRESHOLD = 7;
const MIN_STRICT_RESULTS = 4;
const LANDSCAPING_CONFIDENCE_THRESHOLD = 6;
const OSM_REQUEST_TIMEOUT_MS = 9000;
const OSM_CACHE_TTL_MS = 5 * 60 * 1000;

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
    null,
  );
  const [radiusMeters, setRadiusMeters] = useState(RADIUS_OPTIONS[1]);
  const [lastCoords, setLastCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [activeTab, setActiveTab] = useState<"shops" | "products">("shops");
  const [locationDenied, setLocationDenied] = useState(false);
  const [gpsDisabled, setGpsDisabled] = useState(false); // New state added
  const [selectedResultCategoryId, setSelectedResultCategoryId] = useState(
    SHOP_CATEGORIES[0].id,
  );
  const [selectedShop, setSelectedShop] = useState<NearbyShop | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [sortMode, setSortMode] = useState<"relevance" | "distance">(
    "relevance",
  );
  const osmCacheRef = useRef<Map<string, { timestamp: number; elements: OSMElement[] }>>(
    new Map(),
  );

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

  const getSortedCategoryShops = (categoryId: string) => {
    const categoryShops = [...(shopsByCategory[categoryId] || [])];

    if (sortMode === "distance") {
      return categoryShops.sort((first, second) => {
        const firstDistance = first.distanceKm ?? Number.MAX_VALUE;
        const secondDistance = second.distanceKm ?? Number.MAX_VALUE;
        return firstDistance - secondDistance;
      });
    }

    return categoryShops.sort(
      (first, second) =>
        (second.relevanceScore ?? 0) - (first.relevanceScore ?? 0),
    );
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

  const getElementCoords = (element: OSMElement) => {
    if (element.lat != null && element.lon != null) {
      return { latitude: element.lat, longitude: element.lon };
    }
    if (element.center?.lat != null && element.center?.lon != null) {
      return {
        latitude: element.center.lat,
        longitude: element.center.lon,
      };
    }
    return null;
  };

  const getTagTokens = (tags: Record<string, string>, key: string) => {
    const raw = tags[key];
    if (!raw) {
      return [] as string[];
    }
    return raw
      .toLowerCase()
      .split(";")
      .map((token) => token.trim())
      .filter(Boolean);
  };

  const matchesRule = (
    tags: Record<string, string>,
    rule: CategoryRule,
  ) => {
    const tokens = getTagTokens(tags, rule.key);
    if (tokens.length === 0) {
      return false;
    }
    return rule.values.some((value) => tokens.includes(value.toLowerCase()));
  };

  const computeCategoryScore = (
    category: ShopCategory,
    tags: Record<string, string>,
  ) => {
    const includeScore = category.include.reduce((score, rule) => {
      return matchesRule(tags, rule) ? score + rule.weight : score;
    }, 0);

    const excludePenalty = (category.exclude || []).reduce((score, rule) => {
      return matchesRule(tags, rule) ? score + rule.weight : score;
    }, 0);

    return includeScore - excludePenalty;
  };

  const getBusinessSignalsScore = (tags: Record<string, string>) => {
    let score = 0;

    if (tags.name) score += 2;
    if (tags.brand || tags.operator) score += 2;
    if (tags.website || tags["contact:website"]) score += 1;
    if (tags.phone || tags["contact:phone"]) score += 1;
    if (tags.opening_hours) score += 1;

    return score;
  };

  const hasLifecycleClosedTag = (tags: Record<string, string>) => {
    const lifecycleKeys = [
      "disused",
      "abandoned",
      "demolished",
      "razed",
      "removed",
      "construction",
      "proposed",
    ];

    if (
      lifecycleKeys.some((key) => {
        const value = (tags[key] || "").toLowerCase();
        return value === "yes" || value === "true";
      })
    ) {
      return true;
    }

    if (
      Object.keys(tags).some(
        (key) =>
          key.startsWith("disused:") ||
          key.startsWith("abandoned:") ||
          key.startsWith("demolished:"),
      )
    ) {
      return true;
    }

    const openingHours = (tags.opening_hours || "").toLowerCase();
    if (["closed", "off", "unknown"].includes(openingHours)) {
      return true;
    }

    return false;
  };

  const isLikelyResidentialOrPrivate = (tags: Record<string, string>) => {
    const access = (tags.access || "").toLowerCase();
    const building = (tags.building || "").toLowerCase();
    const landuse = (tags.landuse || "").toLowerCase();
    const hasBusinessTag = Boolean(tags.shop || tags.craft || tags.office || tags.service || tags.trade);

    if (["private", "no"].includes(access) && !hasBusinessTag) {
      return true;
    }

    if (
      ["house", "residential", "apartments", "detached", "hut"].includes(
        building,
      ) &&
      !hasBusinessTag
    ) {
      return true;
    }

    if (landuse === "residential" && !tags.shop && !tags.craft && !tags.amenity) {
      return true;
    }

    return false;
  };

  const getBusinessDisplayName = (tags: Record<string, string>) => {
    const candidates = [
      tags.name,
      tags["name:en"],
      tags.official_name,
      tags.short_name,
      tags.brand,
      tags.operator,
    ];
    const found = candidates.find((value) => value && value.trim().length > 1);
    return found?.trim() || null;
  };

  const classifyElementByCategory = (
    element: OSMElement,
    distanceKm: number,
  ) => {
    const tags = element.tags || {};

    if (hasLifecycleClosedTag(tags) || isLikelyResidentialOrPrivate(tags)) {
      return [] as Array<{ categoryId: string; score: number }>;
    }

    const businessSignalsScore = getBusinessSignalsScore(tags);
    const distancePenalty = Math.min(distanceKm, 20) * 0.25;
    const matches: Array<{ categoryId: string; score: number }> = [];

    const hasBusinessIdentity = Boolean(getBusinessDisplayName(tags));
    const hasContactSignals =
      Boolean(tags.website || tags["contact:website"]) ||
      Boolean(tags.phone || tags["contact:phone"]) ||
      Boolean(tags.opening_hours);

    if (!hasBusinessIdentity && !hasContactSignals) {
      return matches;
    }

    SHOP_CATEGORIES.forEach((category) => {
      const categoryScore = computeCategoryScore(category, tags);
      const categoryThreshold =
        category.id === "landscaping"
          ? LANDSCAPING_CONFIDENCE_THRESHOLD
          : CATEGORY_CONFIDENCE_THRESHOLD;

      if (categoryScore < categoryThreshold) {
        return;
      }

      const isOfficeOnlyLandscaping =
        category.id === "landscaping" &&
        Boolean(tags.office) &&
        !tags.shop &&
        !tags.craft;

      if (isOfficeOnlyLandscaping && !hasContactSignals) {
        return;
      }

      const finalScore = categoryScore + businessSignalsScore - distancePenalty;
      if (finalScore >= GLOBAL_CONFIDENCE_THRESHOLD) {
        matches.push({ categoryId: category.id, score: finalScore });
      }
    });

    return matches;
  };

  const buildStrictQuery = (
    coords: { latitude: number; longitude: number },
    searchRadius: number,
  ) => {
    const clauses: string[] = [];

    SHOP_CATEGORIES.forEach((category) => {
      category.include.forEach((rule) => {
        rule.values.forEach((value) => {
          clauses.push(
            `node(around:${searchRadius},${coords.latitude},${coords.longitude})[${rule.key}="${value}"];`,
          );
          clauses.push(
            `way(around:${searchRadius},${coords.latitude},${coords.longitude})[${rule.key}="${value}"];`,
          );
        });
      });
    });

    return `
[out:json][timeout:25];
(
  ${clauses.join("\n  ")}
);
out center tags;
`;
  };

  const buildBroadQuery = (
    coords: { latitude: number; longitude: number },
    searchRadius: number,
  ) => {
    return `
[out:json][timeout:25];
(
  node(around:${searchRadius},${coords.latitude},${coords.longitude})[shop~"garden_centre|florist|hardware|doityourself|agrarian|farm|trade|tools|supermarket"];
  way(around:${searchRadius},${coords.latitude},${coords.longitude})[shop~"garden_centre|florist|hardware|doityourself|agrarian|farm|trade|tools|supermarket"];
  relation(around:${searchRadius},${coords.latitude},${coords.longitude})[shop~"garden_centre|florist|hardware|doityourself|agrarian|farm|trade|tools|supermarket"];
  node(around:${searchRadius},${coords.latitude},${coords.longitude})[amenity~"marketplace|garden_centre"];
  way(around:${searchRadius},${coords.latitude},${coords.longitude})[amenity~"marketplace|garden_centre"];
  relation(around:${searchRadius},${coords.latitude},${coords.longitude})[amenity~"marketplace|garden_centre"];
  node(around:${searchRadius},${coords.latitude},${coords.longitude})[craft~"gardener|landscaper"];
  way(around:${searchRadius},${coords.latitude},${coords.longitude})[craft~"gardener|landscaper"];
  relation(around:${searchRadius},${coords.latitude},${coords.longitude})[craft~"gardener|landscaper"];
  node(around:${searchRadius},${coords.latitude},${coords.longitude})[service~"landscaper|gardener"];
  way(around:${searchRadius},${coords.latitude},${coords.longitude})[service~"landscaper|gardener"];
  relation(around:${searchRadius},${coords.latitude},${coords.longitude})[service~"landscaper|gardener"];
  node(around:${searchRadius},${coords.latitude},${coords.longitude})[trade~"landscaping|horticulture"];
  way(around:${searchRadius},${coords.latitude},${coords.longitude})[trade~"landscaping|horticulture"];
  relation(around:${searchRadius},${coords.latitude},${coords.longitude})[trade~"landscaping|horticulture"];
  node(around:${searchRadius},${coords.latitude},${coords.longitude})[office="landscape_architect"];
  way(around:${searchRadius},${coords.latitude},${coords.longitude})[office="landscape_architect"];
  relation(around:${searchRadius},${coords.latitude},${coords.longitude})[office="landscape_architect"];
);
out center tags;
`;
  };

  const fetchNearbyShopsFromOsm = async (
    coords: { latitude: number; longitude: number },
    searchRadius: number,
  ) => {
    const cacheKey = `${coords.latitude.toFixed(3)}:${coords.longitude.toFixed(3)}:${searchRadius}`;
    const cached = osmCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < OSM_CACHE_TTL_MS) {
      return cached.elements;
    }

    const fetchEndpointWithTimeout = async (endpoint: string, query: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OSM_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: query,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Overpass request failed (${endpoint}): ${response.status}`);
        }

        const data = (await response.json()) as OverpassResponse;
        return data.elements || [];
      } finally {
        clearTimeout(timeout);
      }
    };

    const runQueryWithFallback = async (query: string) => {
      let remaining = OVERPASS_ENDPOINTS.length;
      let settled = false;
      let lastError: unknown = null;

      return new Promise<OSMElement[]>((resolve, reject) => {
        OVERPASS_ENDPOINTS.forEach((endpoint) => {
          fetchEndpointWithTimeout(endpoint, query)
            .then((elements) => {
              if (settled) {
                return;
              }
              settled = true;
              resolve(elements);
            })
            .catch((error) => {
              lastError = error;
              remaining -= 1;
              if (remaining === 0 && !settled) {
                reject(lastError || new Error("All Overpass endpoints failed."));
              }
            });
        });
      });
    };

    const strictResults = await runQueryWithFallback(
      buildStrictQuery(coords, searchRadius),
    );

    if (strictResults.length >= MIN_STRICT_RESULTS) {
      osmCacheRef.current.set(cacheKey, {
        timestamp: Date.now(),
        elements: strictResults,
      });
      return strictResults;
    }

    const broadResults = await runQueryWithFallback(
      buildBroadQuery(coords, searchRadius),
    );

    const mergedById = new Map<string, OSMElement>();
    [...strictResults, ...broadResults].forEach((element) => {
      mergedById.set(`${element.type}-${element.id}`, element);
    });

    const merged = Array.from(mergedById.values());
    osmCacheRef.current.set(cacheKey, {
      timestamp: Date.now(),
      elements: merged,
    });
    return merged;
  };

  const loadNearbyShops = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setLoadingShops(true);
    setSearchErrorMessage(null);
    try {
      setNoResults(false);
      const elements = await fetchNearbyShopsFromOsm(coords, MAX_RADIUS);

      const nextByCategory = SHOP_CATEGORIES.reduce<Record<string, NearbyShop[]>>(
        (acc, category) => {
          acc[category.id] = [];
          return acc;
        },
        {},
      );

      const perCategoryIds = SHOP_CATEGORIES.reduce<Record<string, Set<string>>>(
        (acc, category) => {
          acc[category.id] = new Set<string>();
          return acc;
        },
        {},
      );

      elements.forEach((element) => {
        const tags = element.tags || {};
        const displayName = getBusinessDisplayName(tags);
        if (!displayName) {
          return;
        }

        const location = getElementCoords(element);

        if (!location) {
          return;
        }

        const distanceKm = getDistanceKm(coords, location);
        const categoryMatches = classifyElementByCategory(element, distanceKm);

        if (categoryMatches.length === 0) {
          return;
        }

        const vicinity =
          element.tags?.["addr:street"] ||
          element.tags?.["addr:city"] ||
          element.tags?.["addr:suburb"] ||
          null;

        const baseShop: NearbyShop = {
          id: `${element.type}-${element.id}`,
          name: displayName,
          rating: null,
          vicinity,
          location,
          distanceKm,
        };

        categoryMatches.forEach(({ categoryId, score }) => {
          if (!perCategoryIds[categoryId].has(baseShop.id)) {
            perCategoryIds[categoryId].add(baseShop.id);
            nextByCategory[categoryId].push({
              ...baseShop,
              relevanceScore: score,
            });
          }
        });
      });

      Object.keys(nextByCategory).forEach((categoryId) => {
        nextByCategory[categoryId].sort(
          (first, second) =>
            (second.relevanceScore || 0) - (first.relevanceScore || 0),
        );
      });

      setAllShopsByCategory(nextByCategory);
      applyRadiusFilter(nextByCategory, radiusMeters);
      setSearchErrorMessage(null);
    } catch (error) {
      console.error("Nearby shops (OSM) error:", error);
      setSearchErrorMessage(
        "We couldn't load nearby shops right now. Please try refreshing in a few moments.",
      );
    } finally {
      setLoadingShops(false);
    }
  };

  // Reusable loader so we can call it from buttons (Refresh)
  const loadLocationAsync = async () => {
    setLoadingLocation(true);
    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      if (!currentPermission.granted) {
        setLocationDenied(true);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.warn("Location services are disabled :(");
        setGpsDisabled(true);
        return;
      }

      setLocationDenied(false);
      setGpsDisabled(false);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

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
    } finally {
      setLoadingLocation(false);
      setInitialLoading(false);
    }
  };

  // Called when user taps Refresh: this will request permission (prompts if needed)
  const handleRefresh = async () => {
    setLoadingLocation(true);
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

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
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
      console.error("Refresh location error:", error);
    } finally {
      setLoadingLocation(false);
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

  useEffect(() => {
    const activeCategoryIds = SHOP_CATEGORIES.filter(
      (category) => activeCategories[category.id],
    ).map((category) => category.id);

    if (activeCategoryIds.length === 0) {
      return;
    }

    const hasCurrent = activeCategoryIds.includes(selectedResultCategoryId);
    if (hasCurrent) {
      return;
    }

    const firstWithResults = activeCategoryIds.find(
      (categoryId) => (shopsByCategory[categoryId]?.length ?? 0) > 0,
    );
    setSelectedResultCategoryId(firstWithResults || activeCategoryIds[0]);
  }, [activeCategories, shopsByCategory, selectedResultCategoryId]);

  const activeCategoryCount = SHOP_CATEGORIES.filter(
    (category) => activeCategories[category.id],
  ).length;
  const activeResultCategories = SHOP_CATEGORIES.filter(
    (category) => activeCategories[category.id],
  );
  const selectedResultCategory =
    activeResultCategories.find(
      (category) => category.id === selectedResultCategoryId,
    ) || activeResultCategories[0] || null;
  const selectedCategoryResults = selectedResultCategory
    ? getSortedCategoryShops(selectedResultCategory.id)
    : [];
  const totalFilteredResults = SHOP_CATEGORIES.reduce((total, category) => {
    if (!activeCategories[category.id]) {
      return total;
    }
    return total + (shopsByCategory[category.id]?.length ?? 0);
  }, 0);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1 mt-4">
        <View className="items-center mb-6">
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
          {activeTab === "products" ? <View className="bg-white/90 flex-row items-center px-4 rounded-2xl shadow-sm">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder={
                "Search products"
              }
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-base text-[#1F2937]"
            />
          </View>
           : null}
        </View>

        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-5 pt-8 pb-6">
          {initialLoading || (activeTab === "shops" && loadingLocation) ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#5F7A4B" />
              <Text className="text-sm text-gray-500 mt-3">
                Detecting location...
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
            {activeTab === "shops" ? (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-[#1F2937]">
                    Shops Nearby
                  </Text>
                  {!locationDenied && !gpsDisabled && (
                    <TouchableOpacity
                      onPress={() => handleRefresh()}
                      className="flex-row items-center bg-white/90 px-3 py-2 rounded-full"
                    >
                      <Ionicons name="refresh" size={16} color="#5F7A4B" />
                      <Text className="ml-2 text-sm font-semibold text-[#5F7A4B]">
                        Refresh
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {locationDenied || gpsDisabled ? (
                  <View className="bg-white/90 rounded-2xl p-6 items-center shadow-sm">
                    <View className="w-14 h-14 rounded-full bg-[#5F7A4B]/10 items-center justify-center mb-3">
                      <Ionicons name="location" size={26} color="#5F7A4B" />
                    </View>
                    <Text className="text-base font-semibold text-[#1F2937] mb-2 text-center">
                      {locationDenied
                        ? "Location permission needed"
                        : "Location services disabled"}
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
                        <Text className="text-white font-semibold">
                          Open Settings
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRefresh()}
                        className="bg-white/80 px-5 py-2.5 rounded-full border border-gray-200"
                      >
                        <Text className="text-[#1F2937] font-semibold">
                          Refresh
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : searchErrorMessage ? (
                  <View className="bg-white/90 rounded-2xl p-6 items-center shadow-sm">
                    <View className="w-14 h-14 rounded-full bg-[#5F7A4B]/10 items-center justify-center mb-3">
                      <Ionicons
                        name="alert-circle-outline"
                        size={26}
                        color="#5F7A4B"
                      />
                    </View>
                    <Text className="text-base font-semibold text-[#1F2937] mb-2 text-center">
                      Unable to load nearby shops
                    </Text>
                    <Text className="text-sm text-gray-500 text-center mb-4">
                      {searchErrorMessage}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRefresh()}
                      className="bg-[#5F7A4B] px-5 py-2.5 rounded-full"
                    >
                      <Text className="text-white font-semibold">Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View className="rounded-2xl overflow-hidden border border-white/60 shadow-sm mb-4">
                      <MapView
                        style={{ height: 240, width: "100%" }}
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
                      <View className="bg-white/90 rounded-2xl px-4 py-3 mb-4 border border-white/70">
                        <Text className="text-sm font-semibold text-[#1F2937]">
                          {totalFilteredResults} results • {activeCategoryCount} categories • {radiusMeters / 1000} km
                        </Text>
                        <View className="flex-row mt-3">
                          <TouchableOpacity
                            onPress={() => setSortMode("relevance")}
                            className={`px-3 py-1.5 rounded-full mr-2 border ${
                              sortMode === "relevance"
                                ? "bg-[#5F7A4B] border-[#5F7A4B]"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                sortMode === "relevance"
                                  ? "text-white"
                                  : "text-[#1F2937]"
                              }`}
                            >
                              Relevance
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setSortMode("distance")}
                            className={`px-3 py-1.5 rounded-full border ${
                              sortMode === "distance"
                                ? "bg-[#5F7A4B] border-[#5F7A4B]"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                sortMode === "distance"
                                  ? "text-white"
                                  : "text-[#1F2937]"
                              }`}
                            >
                              Distance
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

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
                        <>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: 8 }}
                            className="mb-4"
                          >
                            {activeResultCategories.map((category) => {
                              const isSelected =
                                selectedResultCategory?.id === category.id;
                              const count = shopsByCategory[category.id]?.length ?? 0;
                              return (
                                <TouchableOpacity
                                  key={category.id}
                                  onPress={() =>
                                    setSelectedResultCategoryId(category.id)
                                  }
                                  className={`mr-2 px-4 py-2 rounded-full border ${
                                    isSelected
                                      ? "bg-[#5F7A4B] border-[#5F7A4B]"
                                      : "bg-white border-white/70"
                                  }`}
                                >
                                  <Text
                                    className={`text-xs font-semibold ${
                                      isSelected ? "text-white" : "text-[#1F2937]"
                                    }`}
                                  >
                                    {category.label} ({count})
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>

                          {selectedResultCategory ? (
                            <View>
                              <Text className="text-xs text-gray-500 mb-2 px-1">
                                {selectedResultCategory.label} • showing all {selectedCategoryResults.length} results • sorted by {sortMode}
                              </Text>
                              {selectedCategoryResults.length === 0 ? (
                                <View className="bg-white/90 rounded-2xl p-4">
                                  <Text className="text-sm text-gray-500 text-center">
                                    No results in this category for current filters.
                                  </Text>
                                </View>
                              ) : (
                                selectedCategoryResults.map((shop: NearbyShop) => (
                                  <TouchableOpacity
                                    key={shop.id}
                                    onPress={() => {
                                      setSelectedShop(shop);
                                      setMapModalVisible(true);
                                    }}
                                    className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3 mb-3 shadow-sm"
                                  >
                                    <View className="flex-row items-center">
                                      <View className="w-10 h-10 rounded-full bg-[#5F7A4B]/15 items-center justify-center mr-3">
                                        <ShoppingBag size={20} color="#5F7A4B" />
                                      </View>
                                      <View>
                                        <Text className="text-base font-semibold text-[#1F2937]">
                                          {shop.name}
                                        </Text>
                                        <Text className="text-sm text-gray-500">
                                          {shop.vicinity || "Address not available"}
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
                                ))
                              )}
                            </View>
                          ) : (
                            <View className="bg-white/90 rounded-2xl p-4">
                              <Text className="text-sm text-gray-500 text-center">
                                Enable at least one category to see results.
                              </Text>
                            </View>
                          )}
                        </>
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
          )}
        </View>
      </SafeAreaView>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl"
          >
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <Leaf size={32} color="#5F7A4B" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-1 text-center">
              {modalTitle}
            </Text>
            <Text className="text-gray-500 text-sm mb-6 font-medium text-center">
              {modalMessage}
            </Text>

            {isLocationModal ? (
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  onPress={() => Linking.openSettings()}
                  className="flex-1 bg-white/80 py-3 rounded-xl items-center border border-gray-200"
                >
                  <Text className="text-[#1F2937] font-semibold">
                    Open Settings
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    handleRefresh();
                  }}
                  className="flex-1 bg-[#5F7A4B] py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="mt-2 bg-[#5F7A4B] py-3 rounded-xl w-full items-center"
              >
                <Text className="text-white font-semibold">OK</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={mapModalVisible}
        animationType="fade"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setMapModalVisible(false)}
          className="justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl"
          >
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <MapPin size={32} color="#5F7A4B" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-1 text-center">
              Open in Maps?
            </Text>
            <Text className="text-gray-500 text-sm mb-4 font-medium text-center">
              {selectedShop?.name || "Selected shop"}
              {"\n"}Do you want directions to this location?
            </Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setMapModalVisible(false)}
                className="flex-1 bg-white/80 py-3 rounded-xl items-center border border-gray-200"
              >
                <Text className="text-[#1F2937] font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setMapModalVisible(false);
                  openMapsDirections();
                }}
                className="flex-1 bg-[#5F7A4B] py-3 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Open Maps</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
