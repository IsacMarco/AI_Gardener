import PlantCardExtended from "@/components/PlantCardExtended";
import { getAuth, FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Brain, Plus, RefreshCcw, WifiOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlants } from "../../context/PlantContext";
import { useI18n } from "../../context/I18nContext";

const auth = getAuth();

export default function MyPlants() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    plants,
    loading,
    refreshPlants,
    deletePlant,
    lastPlantsSource,
    shouldShowOfflineModal,
    dismissLocalFallbackNotice,
  } = usePlants();
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPlants();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNoUser = () => {
    if (!user) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <LinearGradient
            colors={["#5F7A4B", "#8C8673", "#AFA696"]}
            locations={[0, 0.6, 1]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <Text className="text-gray-600 text-lg">
            {t("myPlants.loginRequired")}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="mt-4 bg-green-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold text-lg">
              {t("myPlants.goToLogin")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (isFocused && shouldShowOfflineModal && !showOfflineModal) {
      setShowOfflineModal(true);
    }
  }, [isFocused, shouldShowOfflineModal, showOfflineModal]);

  if (!user) {
    return handleNoUser();
  }

  return (
    <View className="flex-1">
      <Modal visible={showOfflineModal && isFocused} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white p-6 rounded-3xl items-center w-full max-w-sm">
            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
              <WifiOff size={30} color="#D97706" />
            </View>
            <Text className="text-xl font-bold mb-2 text-center">
              {t("home.noServer")}
            </Text>
            <Text className="text-gray-500 mb-6 text-center leading-5">
              {t("home.noServerMsg")}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowOfflineModal(false);
                dismissLocalFallbackNotice();
              }}
              className="bg-[#5F7A4B] w-full py-3 rounded-xl"
            >
              <Text className="text-white text-center font-bold">{t("home.understand")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1">
        <View className="items-center mt-4 mb-6 px-5">
          <Text className="text-3xl font-bold text-white tracking-wider">
            {t("myPlants.title")}
          </Text>
          <Text className="text-white/85 mt-2 text-base text-center">
            {t("myPlants.subtitle")}
          </Text>
        </View>
        <View className="flex-1 bg-[#F2F1ED] rounded-t-[35px] px-5 pt-6 pb-4">
          {lastPlantsSource === "local" && (
            <View className="mb-4 bg-orange-100 border border-orange-200 rounded-2xl px-4 py-3 flex-row items-center">
              <WifiOff size={18} color="#D97706" />
              <Text className="ml-2 text-orange-800 font-semibold">
                {t("home.offlineMode")}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.push("/aiChat")}
              className="flex-1 flex-row items-center py-4 px-4 rounded-2xl border border-[#6e865b] bg-[#F7F6F2]"
            >
              <View className="mr-2">
                <Brain size={21} color="#5F7A4B" />
              </View>
              <Text className="text-[#1F2937] font-bold text-[15px]">
                {t("myPlants.talkToAi")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: "/addPlant", params: { from: "myPlants" } })
              }
              className="ml-3 bg-[#5F7A4B] rounded-2xl px-4 py-4 flex-row items-center justify-center"
            >
              <Plus size={18} color="white" />
              <Text className="text-white font-semibold ml-2">{t("myPlants.add")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRefresh}
              disabled={refreshing}
              className="ml-3 bg-white rounded-2xl px-4 py-4 flex-row items-center justify-center"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#5F7A4B" />
              ) : (
                <RefreshCcw size={18} color="#5F7A4B" />
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#5F7A4B" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
            >
              {plants.length === 0 ? (
                <View className="items-center mt-6">
                  <Text className="text-gray-500 text-lg">{t("myPlants.empty")}</Text>
                  <Text className="text-gray-400">
                    {t("myPlants.emptyHint")}
                  </Text>
                </View>
              ) : (
                plants.map((plant) => {
                  const remindersEnabled = Boolean(plant.watering?.enabled);
                  let scheduleText = t("home.noSchedule");
                  if (plant.watering?.enabled && plant.watering?.frequency) {
                    scheduleText = t("home.everyDaysAt", {
                      days: plant.watering.frequency,
                      time: plant.watering.time,
                    });
                  } else if (plant.watering && !plant.watering.enabled) {
                    scheduleText = t("home.remindersOff");
                  }

                  const imageSource = plant.imageBase64
                    ? { uri: plant.imageBase64 }
                    : require("../../assets/icons/plants_icon.png");
                  return (
                    <PlantCardExtended
                      key={plant._id}
                      id={plant._id}
                      name={plant.name}
                      schedule={scheduleText}
                      from="myPlants"
                      remindersEnabled={remindersEnabled}
                      image={imageSource}
                      specie={plant.species || t("myPlants.unknownSpecies")}
                      onDelete={() => {
                        void deletePlant(plant._id);
                      }}
                    />
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
