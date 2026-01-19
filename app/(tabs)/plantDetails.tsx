import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Clock,
  Edit3,
  MapPin,
  Sprout,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlants } from "../../context/PlantContext";
const { height } = Dimensions.get("window");
export default function PlantDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { plants, deletePlant } = usePlants();
  const plant = plants.find((p) => p._id === id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wateredToday, setWateredToday] = useState(false);
  if (!plant) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f5f5f5]">
        <Text className="text-gray-500">Plant not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-[#5F7A4B] font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const imageSource = plant.imageBase64
    ? { uri: plant.imageBase64 }
    : require("../../assets/icons/plants_icon.png");
  // Verificam daca alertele sunt active
  const isWateringEnabled = plant.watering?.enabled;
  const handleWaterPlant = () => {
    setWateredToday(true);
    Alert.alert("Yey!", `You just watered ${plant.name}. Good job! 🌱`);
  };
  const handleDelete = async () => {
    try {
      await deletePlant(plant._id);
      setShowDeleteModal(false);
      router.back();
    } catch (error) {
      Alert.alert("Error", "Could not delete plant.");
    }
  };

  return (
    <View className="flex-1 bg-[#F2F1ED]">
      <StatusBar barStyle="light-content" />

      {/* --- HERO IMAGE --- */}
      <View className="absolute top-0 w-full" style={{ height: height * 0.45 }}>
        {plant.imageBase64 ? (
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-[#A4B58E] items-center justify-center">
            <Sprout size={80} color="white" />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 150,
          }}
        />
      </View>

      {/* --- HEADER --- */}
      <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-black/30 rounded-full items-center justify-center backdrop-blur-md"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="w-10 h-10 bg-black/30 rounded-full items-center justify-center backdrop-blur-md"
            onPress={() => router.push(`/editPlant?id=${plant._id}`)}
          >
            <Edit3 size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 bg-red-500/80 rounded-full items-center justify-center backdrop-blur-md"
            onPress={() => setShowDeleteModal(true)}
          >
            <Trash2 size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* --- MAIN CONTENT --- */}
      <View className="flex-1" style={{ paddingTop: height * 0.38 }}>
        <View className="bg-[#F2F1ED] rounded-t-[40px] px-6 pt-8 pb-20 min-h-screen shadow-2xl">
          {/* Titlu */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-[#1F2937] mb-1">
              {plant.name}
            </Text>
            <Text className="text-lg text-gray-500 italic font-medium">
              {plant.species || "Unknown Species"}
            </Text>
          </View>

          {/* --- GRID DETALII --- */}
          <View className="flex-row flex-wrap justify-between mb-8">
            {/* 1. Card Locatie */}
            <View className="w-[48%] bg-white p-3 rounded-2xl shadow-sm mb-4 flex-row items-center">
              <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3 flex-shrink-0">
                <MapPin size={20} color="#F59E0B" />
              </View>
              {/* Adaugat flex-1 pentru a gestiona latimea textului */}
              <View className="flex-1">
                <Text className="text-xs text-gray-400 font-bold uppercase">
                  Location
                </Text>
                {/* Permitem 2 linii, apoi punem ... */}
                <Text
                  className="text-gray-800 font-semibold text-sm"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {plant.location || "Not specified"}
                </Text>
              </View>
            </View>

            {/* 2. Card Frecventa */}
            {isWateringEnabled && (
              <View className="w-[48%] bg-white p-3 rounded-2xl shadow-sm mb-4 flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3 flex-shrink-0">
                  <Calendar size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 font-bold uppercase">
                    Frequency
                  </Text>
                  <Text className="text-gray-800 font-semibold text-sm">
                    Every {plant.watering?.frequency || "?"} days
                  </Text>
                </View>
              </View>
            )}

            {/* 3. Card Ora */}
            {isWateringEnabled && (
              <View className="w-[48%] bg-white p-3 rounded-2xl shadow-sm mb-4 flex-row items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3 flex-shrink-0">
                  <Clock size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 font-bold uppercase">
                    Time
                  </Text>
                  <Text className="text-gray-800 font-semibold text-sm">
                    {plant.watering?.time || "Anytime"}
                  </Text>
                </View>
              </View>
            )}

            {/* 4. Card Alert Status */}
            <View className="w-[48%] bg-white p-3 rounded-2xl shadow-sm flex-row items-center mb-4">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 flex-shrink-0 ${
                  isWateringEnabled ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Ionicons
                  name="notifications"
                  size={20}
                  color={isWateringEnabled ? "#5F7A4B" : "#9CA3AF"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400 font-bold uppercase">
                  Alerts
                </Text>
                <Text
                  className={`font-semibold text-sm ${
                    isWateringEnabled ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {isWateringEnabled ? "On" : "Off"}
                </Text>
              </View>
            </View>
          </View>

          {/* --- WATERING ACTION SECTION --- */}
          {/* Afisam sectiunea de udare doar daca alertele sunt ON, 
              sau o lasam vizibila dar fara numaratoare? 
              De obicei vrei sa poti uda planta si manual.
              O las activa, dar poti ascunde tot blocul cu {isWateringEnabled && (...)} daca vrei. 
          */}
          {/* <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <Text className="text-xl font-bold text-[#1F2937] mb-4">
              Watering Status
            </Text>

            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-gray-400 text-sm">Next watering in</Text>
                {isWateringEnabled ? (
                  <Text className="text-3xl font-bold text-[#5F7A4B]">
                    {wateredToday ? plant.watering?.frequency : 0}{" "}
                    <Text className="text-lg text-gray-600 font-normal">
                      days
                    </Text>
                  </Text>
                ) : (
                  <Text className="text-xl font-bold text-gray-400 mt-1">
                    Manual Mode
                  </Text>
                )}
              </View>
              <View className="w-16 h-16 bg-[#E8F5E9] rounded-full items-center justify-center">
                <Droplets
                  size={32}
                  color="#5F7A4B"
                  fill={wateredToday ? "#5F7A4B" : "transparent"}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleWaterPlant}
              disabled={wateredToday}
              activeOpacity={0.8}
              className={`w-full py-4 rounded-2xl flex-row justify-center items-center shadow-md ${
                wateredToday ? "bg-[#A4B58E]" : "bg-[#5F7A4B]"
              }`}
            >
              {wateredToday ? (
                <>
                  <Check size={24} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-lg">
                    All hydrated!
                  </Text>
                </>
              ) : (
                <>
                  <Droplets size={24} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-lg">
                    Water Plant Now
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {wateredToday && (
              <Text className="text-center text-gray-400 text-xs mt-3">
                Great job! We've reset the timer for you.
              </Text>
            )}
          </View> */}
        </View>
      </View>

      {/* --- MODAL CONFIRMARE STERGERE --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-xl">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Trash2 size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Delete Plant?
            </Text>
            <Text className="text-gray-500 text-center mb-6 px-2">
              Are you sure you want to remove{" "}
              <Text className="font-bold">{plant.name}</Text> from your garden?
            </Text>

            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-xl"
              >
                <Text className="text-gray-700 font-bold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 bg-red-500 py-3 rounded-xl"
              >
                <Text className="text-white font-bold text-center">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
