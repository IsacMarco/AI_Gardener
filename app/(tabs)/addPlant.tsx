import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddPlant() {
  const router = useRouter();

  // Minimal plant data (frontend)
  const [plantName, setPlantName] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Watering schedule (minimal)
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [wateringIntervalDays, setWateringIntervalDays] = useState(3);
  const [wateringTime, setWateringTime] = useState("20:00");

  const isSaveDisabled = useMemo(() => !plantName.trim(), [plantName]);

  const handleSave = () => {
    const name = plantName.trim();
    if (!name) {
      Alert.alert("Missing name", "Please enter a plant name.");
      return;
    }

    const newPlant = {
      id: String(Date.now()),
      name,
      species: species.trim() || undefined,
      location: location.trim() || undefined,
      createdAt: new Date().toISOString(),
      watering: {
        enabled: remindersEnabled,
        intervalDays: wateringIntervalDays,
        time: wateringTime.trim() || undefined,
      },
    };

    console.log("NEW PLANT:", newPlant);
    router.back();
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Gallery permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
  };

  const handleAddPhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Photo picking is not available on web.");
      return;
    }

    Alert.alert("Add photo", "Choose source", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Gallery", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
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
        <View className="flex-1">
          <View className="flex-row items-center px-4 py-2 mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-2xl font-bold text-white mr-10 tracking-wider">
              Add New Plant
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="items-center justify-center py-6 mb-2">
                <TouchableOpacity
                  onPress={handleAddPhoto}
                  activeOpacity={0.85}
                  className="flex-row items-center gap-4"
                >
                  <View className="w-24 h-24 bg-[#E8F5E9]/80 rounded-full items-center justify-center border-4 border-white/30 shadow-sm overflow-hidden">
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Camera size={35} color="#5F7A4B" />
                    )}
                  </View>

                  <Text className="text-white/90 text-lg font-medium">
                    {photoUri ? "Change photo" : "Tap to add photo"}
                  </Text>
                  {photoUri ? (
                    <TouchableOpacity
                      onPress={() => setPhotoUri(null)}
                      className="p-1 bg-white/30 rounded-full"
                    >
                      <Ionicons name="trash" size={20} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <></>
                  )}
                </TouchableOpacity>
              </View>

              <View className="bg-[#E8E6DE]/95 flex-1 rounded-t-[35px] px-6 pt-8 pb-10 min-h-[650px]">
                {/* Name */}
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  <Text className="text-[#1F2937] font-bold text-base mb-1">Plant Name</Text>
                  <TextInput
                    placeholder="e.g. My plant"
                    placeholderTextColor="#9CA3AF"
                    value={plantName}
                    onChangeText={setPlantName}
                    className="text-base text-[#1F2937] p-0"
                  />
                </View>

                {/* Species (optional) */}
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  <Text className="text-[#1F2937] font-bold text-base mb-1">
                    Species (optional)
                  </Text>
                  <TextInput
                    placeholder="e.g. Monstera deliciosa"
                    placeholderTextColor="#9CA3AF"
                    value={species}
                    onChangeText={setSpecies}
                    className="text-base text-[#1F2937] p-0"
                  />
                </View>

                {/* Location (optional) */}
                <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
                  <Text className="text-[#1F2937] font-bold text-base mb-1">
                    Location (optional)
                  </Text>
                  <TextInput
                    placeholder="e.g. Living room"
                    placeholderTextColor="#9CA3AF"
                    value={location}
                    onChangeText={setLocation}
                    className="text-base text-[#1F2937] p-0"
                  />
                </View>

                <Text className="text-[#1F2937] font-bold text-lg mb-3 ml-1">
                  Watering Schedule
                </Text>

                <View className="bg-white rounded-3xl p-5 shadow-sm mb-8">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-500 text-base font-medium">Set Reminders</Text>
                    <Switch
                      trackColor={{ false: "#6fa57677", true: "#5e7c46ff" }}
                      thumbColor={"#FFFFFF"}
                      ios_backgroundColor="#D1D1D6"
                      onValueChange={setRemindersEnabled}
                      value={remindersEnabled}
                      className="justify-between ml-auto"
                    />
                  </View>

                  {remindersEnabled && (
                    <View className="mb-2">
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[#1F2937] font-medium">Every</Text>

                        <View className="flex-row items-center">
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setWateringIntervalDays((d) => Math.max(1, d - 1))
                            }
                            className="w-10 h-10 bg-[#F9F9F9] rounded-xl items-center justify-center border border-gray-100"
                          >
                            <Text className="text-[#1F2937] font-bold text-lg">-</Text>
                          </TouchableOpacity>

                          <View className="mx-3 min-w-[44px] items-center">
                            <Text className="text-[#1F2937] font-bold text-base">
                              {wateringIntervalDays}
                            </Text>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setWateringIntervalDays((d) => Math.min(30, d + 1))
                            }
                            className="w-10 h-10 bg-[#F9F9F9] rounded-xl items-center justify-center border border-gray-100"
                          >
                            <Text className="text-[#1F2937] font-bold text-lg">+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text className="text-[#1F2937] font-medium">days</Text>
                      </View>

                      <View className="bg-[#F9F9F9] border border-gray-100 rounded-xl px-4 py-3">
                        <Text className="text-gray-500 text-xs mb-1">
                          Preferred time (optional)
                        </Text>
                        <TextInput
                          value={wateringTime}
                          onChangeText={setWateringTime}
                          placeholder="e.g. 20:00"
                          placeholderTextColor="#9CA3AF"
                          className="text-[#1F2937] font-medium p-0"
                        />
                      </View>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  className={`py-4 rounded-2xl items-center mt-auto mb-6 border border-white/30 ${
                    isSaveDisabled
                      ? "bg-[#6B8E4E] opacity-50 shadow-none"
                      : "bg-[#6B8E4E] shadow-md"
                  }`}
                  activeOpacity={isSaveDisabled ? 1 : 0.85}
                  onPress={handleSave}
                  disabled={isSaveDisabled}
                >
                  <Text className={`font-bold text-lg ${isSaveDisabled ? "text-white/80" : "text-white"}`}>
                    Save Plant
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
}