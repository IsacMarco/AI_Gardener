import PlantCardExtended from "@/components/PlantCardExtended";
import { getAuth, FirebaseAuthTypes } from "@react-native-firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Brain, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlants } from "../../context/PlantContext";

const auth = getAuth();

export default function MyPlants() {
  const router = useRouter();
  const { plants, loading } = usePlants();
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const insets = useSafeAreaInsets();

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
            Please log in to see your plants.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="mt-4 bg-green-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold text-lg">
              Go to Login
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

  if (!user) {
    return handleNoUser();
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1">
        <View className="items-center mt-4 mb-6 px-5">
          <Text className="text-3xl font-bold text-white tracking-wider">
            My Garden
          </Text>
          <Text className="text-white/85 mt-2 text-base text-center">
            View and manage your lovely plants.
          </Text>
        </View>
        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-5 pt-6 pb-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/aiPart/aiChat")}
              className="flex-1 bg-[#EBE9DE] flex-row items-center py-4 px-4 rounded-2xl border border-white/60"
            >
              <View className="mr-2">
                <Brain size={21} color="#5F7A4B" />
              </View>
              <Text className="text-[#1F2937] font-bold text-[15px]">
                Talk to AI Gardener
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/aiPart/addPlant")}
              className="ml-3 bg-[#5F7A4B] rounded-2xl px-4 py-4 flex-row items-center justify-center"
            >
              <Plus size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Add</Text>
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
                  <Text className="text-gray-500 text-lg">No plants yet. 🥺</Text>
                  <Text className="text-gray-400">
                    Tap Add to start your gardening journey!
                  </Text>
                </View>
              ) : (
                plants.map((plant) => {
                  let scheduleText = "No schedule";
                  if (plant.watering?.enabled && plant.watering?.frequency) {
                    scheduleText = `Every ${plant.watering.frequency} days at ${plant.watering.time}`;
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
                      image={imageSource}
                      specie={plant.species || "Unknown species"}
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
