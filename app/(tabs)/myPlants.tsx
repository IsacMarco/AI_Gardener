import PlantCardExtended from "@/components/PlantCardExtended";
import { Ionicons } from "@expo/vector-icons";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"; // <--- Asigura-te ca calea e corecta
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // <--- Import useFocusEffect
import { Brain, Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react"; // <--- Import useState, useCallback
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

// Definim tipul datelor care vin de la server (MongoDB)
type PlantFromDB = {
  _id: string;
  name: string;
  species?: string;
  location?: string;
  imageBase64?: string;
  watering?: {
    enabled: boolean;
    frequency: number;
    time: string;
  };
};

export default function MyPlants() {
  const router = useRouter();
  const { plants, loading } = usePlants();
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

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
            Please log in to add a plant.
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
    const currentUser = auth().currentUser;
    setUser(currentUser);
    if (!currentUser) {
      handleNoUser();
    }
  }, []);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-white tracking-wider">
            My Garden
          </Text>
        </View>

        {/* Containerul Principal Alb */}
        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-5 pt-8 pb-4">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#5F7A4B" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {plants.length === 0 ? (
                <View className="items-center mt-10">
                  <Text className="text-gray-500 text-lg">No plants yet.</Text>
                  <Text className="text-gray-400">
                    Tap + to start your garden!
                  </Text>
                </View>
              ) : (
                plants.map((plant) => {
                  // Logica pentru a crea textul "Every X days"
                  let scheduleText = "No schedule";
                  if (plant.watering?.enabled && plant.watering?.frequency) {
                    scheduleText = `Every ${plant.watering.frequency} days at ${plant.watering.time}`;
                  }

                  // Logica pentru imagine: Base64 sau placeholder
                  // PlantCardExtended asteapta probabil un obiect {uri: ...} sau require(...)
                  const imageSource = plant.imageBase64
                    ? { uri: plant.imageBase64 }
                    : require("../../assets/icons/plants_icon.png"); // Placeholder-ul tau

                  return (
                    <PlantCardExtended
                      key={plant._id} // MongoDB foloseste _id
                      id={plant._id}
                      name={plant.name}
                      schedule={scheduleText} // Text generat din datele reale
                      image={imageSource}
                      specie={plant.species || "Unknown species"}
                    />
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Butoanele de jos (AI & Add) */}
          <View className="absolute bottom-5 left-5 right-5 flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/aiHelper")}
              className="flex-1 bg-[#EBE9DE] flex-row items-center py-4 px-5 rounded-full mr-4 shadow-sm border border-white/50"
            >
              <View className="mr-3">
                <Brain size={24} color="#5F7A4B" />
              </View>
              <Text className="text-[#1F2937] font-bold text-base">
                Talk to AI Gardener
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="w-14 h-14 bg-[#769055] rounded-full items-center justify-center shadow-lg"
              onPress={() => router.push("/addPlant")}
            >
              <Plus size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
