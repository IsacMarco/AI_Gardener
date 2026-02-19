import PlantCard from "@/components/PlantCard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, Mic, Plus, RefreshCcw, Search, Sprout, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlants } from "../../context/PlantContext";

export default function HomeScreen() {
  const router = useRouter();
  const { plants, loading, refreshPlants } = usePlants();
  const [refreshing, setRefreshing] = useState(false);

  const recentPlants = plants.slice(0, 4);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshPlants();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mt-4 mb-8">
            <Text className="text-3xl font-bold text-white mb-6 tracking-wide shadow-sm">
              Welcome Home!
            </Text>
            <TouchableOpacity
              className="w-40 h-40 bg-[#A4B58E] rounded-full items-center justify-center border-4 border-white/30 shadow-lg"
              onPress={() => router.push("/account")}
            >
              <User size={80} color="white" fill="#a0c472ff" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-6 pt-8 pb-10 min-h-full">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#1F2937] mb-5 pl-1">
                Your Garden at a Glance
              </Text>

              <View className="flex-row items-center">
                {recentPlants.length > 0 && (
                  <Text
                    className="text-md text-gray-600 mb-5 mr-3"
                    onPress={() => router.push("/myPlants")}
                  >
                    see all
                  </Text>
                )}

                <TouchableOpacity
                  onPress={handleRefresh}
                  disabled={refreshing}
                  className="mb-5 p-2 rounded-full bg-[#5F7A4B]"
                  activeOpacity={0.8}
                >
                  {refreshing ? (
                    <ActivityIndicator size={18} color="#FFFFFF" />
                  ) : (
                    <RefreshCcw size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              {loading ? (
                <ActivityIndicator size="small" color="#5F7A4B" />
              ) : recentPlants.length === 0 ? (
                <TouchableOpacity
                  onPress={() => router.push("/addPlant")}
                  activeOpacity={0.7}
                  className="bg-white/50 border-2 border-dashed border-[#5F7A4B]/40 rounded-2xl p-6 items-center justify-center h-48"
                >
                  <View className="w-14 h-14 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-3">
                    <Plus size={30} color="#5F7A4B" />
                  </View>
                  <Text className="text-lg font-bold text-[#1F2937]">
                    Start Your Garden
                  </Text>
                  <Text className="text-gray-500 text-center mt-1 px-4 leading-5">
                    Your garden looks a bit empty. Tap here to add your first
                    plant! 🌱
                  </Text>
                </TouchableOpacity>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    marginBottom: 4,
                    paddingRight: 20,
                  }}
                >
                  {recentPlants.map((plant) => {
                    const imageSource = plant.imageBase64
                      ? { uri: plant.imageBase64 }
                      : require("../../assets/icons/plants_icon.png");
                    let scheduleText = "No schedule";
                    if (plant.watering?.frequency) {
                      scheduleText = `Every ${plant.watering.frequency} days at ${plant.watering.time}`;
                    }
                    return (
                      <PlantCard
                        key={plant._id}
                        id={plant._id}
                        name={plant.name}
                        specie={plant.species || "Unknown"}
                        image={imageSource}
                        schedule={scheduleText}
                      />
                    );
                  })}
                </ScrollView>
              )}
            </View>
            <Text className="text-xl font-bold text-[#1F2937] mb-4 pl-1 pt-2">
              Talk to AI Gardener
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/aiHelper")}
              className="bg-white/90 flex-row items-center px-4 py-3.5 rounded-2xl shadow-sm mb-8"
            >
              <Search size={20} color="#9CA3AF" />
              <Text className="flex-1 ml-3 text-base text-[#9CA3AF]">
                Ask me anything...
              </Text>
              <View className="flex-row gap-4">
                <View>
                  <Camera size={22} color="#5F7A4B" />
                </View>
                <View>
                  <Mic size={22} color="#5F7A4B" />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/marketplace")}
              activeOpacity={0.8}
              className="bg-[#5F7A4B] flex-row items-center justify-between px-4 py-3.5 rounded-2xl shadow-sm mb-8"
            >
              <Text className="text-base text-white font-medium">
                Explore Marketplace
              </Text>
              <Plus size={20} color="white" />
            </TouchableOpacity>
            <View className="mb-20">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                  <Text className="text-xl font-bold text-[#1F2937] mb-2">
                    Daily Plant Care Tip
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    Rotate your houseplants weekly for even growth and prevent
                    leaning towards the light source.
                  </Text>
                </View>
                <View className="mt-1">
                  <Sprout size={32} color="#5F7A4B" />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
