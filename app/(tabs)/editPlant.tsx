import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Bell,
  Calendar,
  Camera,
  Check,
  Clock,
  Image as ImageIcon,
  Minus,
  Plus, // Iconita pentru eroare
  Settings, // Iconita pentru setari
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlants } from "../../context/PlantContext";

// Import Notification Services
import {
  cancelNotification,
  scheduleWateringNotification,
} from "../../services/notifications";

export default function EditPlant() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;

  const { plants, refreshPlants } = usePlants();

  // --- STATE FOR PLANT DATA ---
  const [plantName, setPlantName] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // --- STATE FOR WATERING ---
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [wateringIntervalDays, setWateringIntervalDays] = useState(3);
  const [wateringTime, setWateringTime] = useState("20:00");

  // --- STATE FOR UI ---
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);

  // --- STATE PENTRU PERMISIUNI (MODALE) ---
  const [showPermissionModal, setShowPermissionModal] = useState(false); // Primul modal (Ask)
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Al doilea modal (Denied -> Settings)

  // Helper to format time input
  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }

    if (cleaned.length >= 2) {
      const hours = parseInt(cleaned.slice(0, 2));
      if (hours > 23)
        formatted =
          "23" + (cleaned.length > 2 ? ":" + cleaned.slice(2, 4) : "");
    }
    if (cleaned.length >= 4) {
      const mins = parseInt(cleaned.slice(2, 4));
      if (mins > 59) formatted = formatted.slice(0, 3) + "59";
    }

    setWateringTime(formatted.slice(0, 5));
  };

  // Load initial data
  useEffect(() => {
    const currentPlant = plants.find((p) => p._id === id);
    if (currentPlant) {
      setPlantName(currentPlant.name);
      setSpecies(currentPlant.species || "");
      setLocation(currentPlant.location || "");

      if (currentPlant.imageBase64) {
        setPhotoUri(currentPlant.imageBase64);
      }

      if (currentPlant.watering) {
        setRemindersEnabled(currentPlant.watering.enabled ?? true);
        setWateringIntervalDays(currentPlant.watering.frequency || 3);
        setWateringTime(currentPlant.watering.time || "20:00");
      }
    }
  }, [id, plants]);

  // --- PERMISSION LOGIC ---
  const handleToggleReminders = async (value: boolean) => {
    // Case 1: Turning OFF is always allowed
    if (!value) {
      setRemindersEnabled(false);
      return;
    }

    // Case 2: Turning ON requires checking permissions
    const { status } = await Notifications.getPermissionsAsync();

    if (status === "granted") {
      setRemindersEnabled(true);
    } else {
      // Permission missing -> Show Custom Ask Modal
      setShowPermissionModal(true);
    }
  };

  const requestPermissions = async () => {
    // 1. Request System Permission
    const { status } = await Notifications.requestPermissionsAsync();

    if (status === "granted") {
      // Success!
      setRemindersEnabled(true);
      setShowPermissionModal(false);
    } else {
      // Still denied -> Close Ask Modal -> Open Settings Modal
      setShowPermissionModal(false);
      setTimeout(() => setShowSettingsModal(true), 300); // Mic delay pentru animatie fluida
    }
  };

  // --- PHOTO FUNCTIONS ---
  const handlePhotoSelect = () => {
    setIsSelectionModalVisible(true);
  };

  const pickFromCamera = async () => {
    setIsSelectionModalVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== "granted") {
      alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const pickFromGallery = async () => {
    setIsSelectionModalVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  // --- UPDATE LOGIC (WITH NOTIFICATIONS) ---
  const handleUpdate = async () => {
    if (!plantName.trim()) return;
    setLoading(true);

    try {
      const oldPlantData = plants.find((p) => p._id === id);
      const oldNotificationId = oldPlantData?.watering?.notificationId;
      if (oldNotificationId) {
        await cancelNotification(oldNotificationId);
      }
      // Schedule new notification (only if enabled)
      let newNotificationId = null;
      if (remindersEnabled) {
        newNotificationId = await scheduleWateringNotification(
          plantName.trim(),
          wateringIntervalDays,
          wateringTime,
        );
      }
      const updatePayload = {
        name: plantName.trim(),
        species: species.trim(),
        location: location.trim(),
        watering: {
          enabled: remindersEnabled,
          frequency: wateringIntervalDays,
          time: wateringTime,
          notificationId: newNotificationId,
        },
        imageBase64: photoBase64
          ? `data:image/jpeg;base64,${photoBase64}`
          : photoUri,
      };

      const response = await fetch(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL + `/plants/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        },
      );

      if (response.ok) {
        await refreshPlants();
        setShowSuccessModal(true);
      } else {
        const data = await response.json();
        alert(data.error || "Update failed");
      }
    } catch (error) {
      console.error("Error updating plant:", error);
      alert("Server connection error");
    } finally {
      setLoading(false);
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

      {/* --- SUCCESS MODAL --- */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white p-6 rounded-3xl items-center w-full max-w-sm">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Check size={32} color="#5F7A4B" />
            </View>
            <Text className="text-xl font-bold mb-2">Plant Updated!</Text>
            <Text className="text-gray-500 mb-6 text-center">
              Your changes have been saved successfully.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              className="bg-[#5F7A4B] w-full py-3 rounded-xl"
            >
              <Text className="text-white text-center font-bold">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- NOTIFICATION PERMISSION MODAL (ASK) --- */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white p-6 rounded-3xl items-center w-full max-w-sm shadow-2xl">
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <Bell size={32} color="#5F7A4B" />
            </View>

            <Text className="text-xl font-bold mb-2 text-[#1F2937] text-center">
              Enable Reminders?
            </Text>
            <Text className="text-gray-500 mb-6 text-center leading-5">
              To help your{" "}
              <Text className="font-bold">{plantName || "plant"}</Text> thrive,
              we need permission to send you watering notifications.
            </Text>

            <TouchableOpacity
              onPress={requestPermissions}
              className="bg-[#5F7A4B] w-full py-3.5 rounded-xl mb-3 shadow-sm"
            >
              <Text className="text-white text-center font-bold text-lg">
                Allow Notifications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPermissionModal(false)}
              className="py-2"
            >
              <Text className="text-gray-400 font-medium">Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- SETTINGS MODAL (DENIED) --- */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white p-6 rounded-3xl items-center w-full max-w-sm shadow-2xl">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <AlertCircle size={32} color="#ef4444" />
            </View>

            <Text className="text-xl font-bold mb-2 text-[#1F2937] text-center">
              Notifications Disabled
            </Text>
            <Text className="text-gray-500 mb-6 text-center leading-5">
              You have blocked notifications for this app. Please go to Settings
              to enable them manually.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSettingsModal(false);
                Linking.openSettings(); // <--- DUCE USERUL LA SETARI
              }}
              className="bg-[#1F2937] w-full py-3.5 rounded-xl mb-3 shadow-sm flex-row justify-center items-center"
            >
              <Settings size={20} color="white" className="mr-2" />
              <Text className="text-white text-center font-bold text-lg">
                Open Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSettingsModal(false)}
              className="py-2"
            >
              <Text className="text-gray-400 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- PHOTO SELECTION MODAL --- */}
      <Modal
        visible={isSelectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectionModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl">
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <Camera size={32} color="#5F7A4B" />
            </View>
            <Text className="text-xl font-bold mb-4 text-[#1F2937]">
              Change Photo
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-2 text-base leading-6">
              Select Image From:
            </Text>
            <View className="w-full gap-3">
              <TouchableOpacity
                onPress={pickFromCamera}
                className="bg-[#5F7A4B] w-full py-3.5 rounded-xl flex-row justify-center items-center"
              >
                <Camera size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">
                  Take Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickFromGallery}
                className="bg-[#8C8673] w-full py-3.5 rounded-xl flex-row justify-center items-center"
              >
                <ImageIcon size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setIsSelectionModalVisible(false)}
              className="py-2 mt-6"
            >
              <Text className="text-gray-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center px-4 py-2 mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-2xl font-bold text-white mr-10">
            Edit Plant
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ paddingTop: 15 }}
          >
            <View className="bg-[#E8E6DE]/95 mt-4 rounded-t-[35px] px-6 pt-8 pb-10 min-h-screen">
              <View className="items-center -mt-16 mb-6">
                <TouchableOpacity
                  onPress={handlePhotoSelect}
                  className="relative"
                >
                  <View className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                    {photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        className="w-full h-full"
                      />
                    ) : (
                      <View className="items-center justify-center h-full">
                        <ImageIcon size={40} color="#999" />
                      </View>
                    )}
                  </View>
                  <View className="absolute bottom-0 right-0 bg-[#5F7A4B] p-2 rounded-full border-2 border-white">
                    <Camera size={16} color="white" />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                <Text className="text-gray-400 font-bold text-xs uppercase mb-1 ml-1">
                  Plant Name
                </Text>
                <TextInput
                  value={plantName}
                  onChangeText={setPlantName}
                  className="text-lg text-[#1F2937] border-b border-gray-100 pb-2"
                  placeholder="e.g. My Monstera"
                />
              </View>

              <View className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                <Text className="text-gray-400 font-bold text-xs uppercase mb-1 ml-1">
                  Species
                </Text>
                <TextInput
                  value={species}
                  onChangeText={setSpecies}
                  className="text-lg text-[#1F2937] border-b border-gray-100 pb-2"
                  placeholder="e.g. Monstera deliciosa"
                />
              </View>

              <View className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                <Text className="text-gray-400 font-bold text-xs uppercase mb-1 ml-1">
                  Location
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  className="text-lg text-[#1F2937] border-b border-gray-100 pb-2"
                  placeholder="e.g. Living Room"
                />
              </View>

              <View className="bg-white rounded-3xl p-5 mb-8 shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${remindersEnabled ? "bg-green-100" : "bg-gray-100"}`}
                    >
                      <Bell
                        size={20}
                        color={remindersEnabled ? "#5F7A4B" : "#9CA3AF"}
                      />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-[#1F2937]">
                        Reminders
                      </Text>
                      <Text
                        className={`text-xs font-bold ${remindersEnabled ? "text-[#5F7A4B]" : "text-gray-400"}`}
                      >
                        {remindersEnabled ? "ACTIVE" : "DISABLED"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={remindersEnabled}
                    onValueChange={handleToggleReminders}
                    trackColor={{ true: "#5F7A4B", false: "#E5E7EB" }}
                    thumbColor={"#FFFFFF"}
                  />
                </View>

                {remindersEnabled && (
                  <View className="mt-4 pt-4 border-t border-gray-100">
                    <View className="flex-row items-center justify-between mb-6">
                      <View className="flex-row items-center gap-2">
                        <Calendar size={18} color="#9CA3AF" />
                        <Text className="text-gray-500 font-medium">
                          Frequency
                        </Text>
                      </View>

                      <View className="flex-row items-center bg-gray-50 rounded-2xl p-1">
                        <TouchableOpacity
                          onPress={() =>
                            setWateringIntervalDays((d) => Math.max(1, d - 1))
                          }
                          className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm active:bg-gray-100"
                        >
                          <Minus size={20} color="#1F2937" />
                        </TouchableOpacity>

                        <View className="w-16 items-center">
                          <Text className="font-bold text-xl text-[#5F7A4B]">
                            {wateringIntervalDays}
                          </Text>
                          <Text className="text-[10px] text-gray-400 uppercase font-bold">
                            Days
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => setWateringIntervalDays((d) => d + 1)}
                          className="w-10 h-10 bg-[#5F7A4B] rounded-xl items-center justify-center shadow-sm active:bg-[#4d633d]"
                        >
                          <Plus size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Clock size={18} color="#9CA3AF" />
                        <Text className="text-gray-500 font-medium">
                          Preferred Time
                        </Text>
                      </View>

                      <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-32 items-center">
                        <TextInput
                          value={wateringTime}
                          onChangeText={handleTimeChange}
                          className="font-bold text-xl text-[#1F2937] text-center w-full"
                          maxLength={5}
                          keyboardType="number-pad"
                          placeholder="20:00"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={loading || !plantName.trim()}
                className={`py-4 rounded-2xl flex-row justify-center items-center ${!plantName.trim() ? "bg-gray-400" : "bg-[#5F7A4B]"} shadow-lg mb-6`}
              >
                {loading && (
                  <ActivityIndicator color="white" className="mr-2" />
                )}
                <Text className="text-white font-bold text-lg">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
