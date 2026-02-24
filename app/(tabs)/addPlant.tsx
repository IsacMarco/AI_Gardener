import { Ionicons } from "@expo/vector-icons";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Camera,
  Check,
  Clock,
  Image as ImageIcon,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
import {
  scheduleWateringNotification,
  cancelNotification,
} from "../../services/notifications";

export default function AddPlant() {
  const router = useRouter();
  // --- STATE DATE PLANTA ---
  const [plantName, setPlantName] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  // --- STATE PROGRAM UDARE ---
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [wateringIntervalDays, setWateringIntervalDays] = useState(3);
  const [wateringTime, setWateringTime] = useState("20:00");
  // --- STATE SYSTEM ---
  const { refreshPlants } = usePlants();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  // --- STATE MODAL UNIFICAT ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "success", // 'success' | 'error' | 'info' | 'selection'
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const isSaveDisabled = useMemo(
    () => !plantName.trim() || loading,
    [plantName, loading],
  );
  const showModal = (
    type: "success" | "error" | "info" | "selection",
    title: string,
    message: string,
    onConfirm = () => {},
  ) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    if (modalConfig.type === "success") {
      router.back();
    }
  };
  // --- VERIFICARE USER ---
  useEffect(() => {
    const currentUser = auth().currentUser;
    setUser(currentUser);
  }, []);
  if (!user && !loading) {
  }
  // --- LOGICA DE SALVARE CU TIMEOUT ---
  const handleSave = async () => {
    if (!user) return;
    const name = plantName.trim();
    if (!name) {
      showModal("error", "Missing Name", "Please enter a name for your plant.");
      return;
    }

    setLoading(true);

    try {
      // Step A: Schedule Notification (if enabled)
      let notificationId = null;

      if (remindersEnabled) {
        // We schedule it locally and get the ID back
        notificationId = await scheduleWateringNotification(
          name,
          wateringIntervalDays,
          wateringTime,
        );
      }

      // Step B: Prepare Payload for MongoDB
      // Now we include the notificationId so the server remembers it
      const payload = {
        userId: user.uid,
        name: name,
        species: species.trim(),
        location: location.trim(),
        remindersActive: remindersEnabled,
        frequency: wateringIntervalDays,
        preferredTime: wateringTime,
        imageBase64: photoBase64
          ? `data:image/jpeg;base64,${photoBase64}`
          : null,
        notificationId: notificationId,
      };

      // Step C: Send to Server (Backend)
      // Note: Make sure your server.js is updated to receive "notificationId" inside req.body
      const response = await fetch(
        process.env.EXPO_PUBLIC_MONGO_SERVER_URL + "/add-plant",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        await refreshPlants();
        showModal(
          "success",
          "Plant Added!",
          `${plantName} has been successfully added to your garden.`,
        );
      } else {
        showModal(
          "error",
          "Save Failed",
          data.error || "Could not save plant.",
        );
        // Fallback: If server save fails, we should ideally cancel the notification we just made
        // to avoid "ghost" notifications.
        if (notificationId) {
          await cancelNotification(notificationId); // (Optional but recommended safety)
        }
      }
    } catch (error: any) {
      console.error("Error saving plant:", error);
      showModal("error", "Connection Error", "Check server.");
    } finally {
      setLoading(false);
    }
  };
  // --- LOGICA FOTO ---
  const pickFromCamera = async () => {
    setModalVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      setTimeout(
        () =>
          showModal(
            "error",
            "Permission Needed",
            "Camera permission is required.",
          ),
        500,
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
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
    setModalVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setTimeout(
        () =>
          showModal(
            "error",
            "Permission Needed",
            "Gallery permission is required.",
          ),
        500,
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };
  const handleAddPhoto = async () => {
    if (Platform.OS === "web") {
      showModal(
        "info",
        "Not Supported",
        "Photo picking is not available on web.",
      );
      return;
    }
    showModal(
      "selection",
      "Add Photo",
      "Choose where to upload your plant photo from.",
    );
  };
  // --- LOGICA TIMP ---
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
  // --- RENDER ICON MODAL ---
  const renderModalIcon = () => {
    switch (modalConfig.type) {
      case "success":
        return <Check size={32} color="white" strokeWidth={3} />;
      case "error":
        return <AlertCircle size={32} color="white" strokeWidth={3} />;
      case "selection":
        return <ImageIcon size={32} color="white" strokeWidth={3} />;
      default:
        return <Ionicons name="information" size={32} color="white" />;
    }
  };

  const getModalColor = () => {
    if (modalConfig.type === "error") return "#ef4444"; // Red
    if (modalConfig.type === "selection") return "#5F7A4B"; // Green
    return "#5F7A4B"; // Default Green
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (modalConfig.type !== "success") setModalVisible(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-5 shadow-sm"
              style={{ backgroundColor: getModalColor() }}
            >
              {renderModalIcon()}
            </View>
            <Text className="text-xl font-bold text-[#1F2937] mb-2 text-center">
              {modalConfig.title}
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-2 text-base leading-6">
              {modalConfig.message}
            </Text>
            {modalConfig.type === "selection" ? (
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
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="mt-2 py-2"
                >
                  <Text className="text-gray-400 font-medium text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={closeModal}
                className="w-full py-3.5 rounded-xl shadow-sm active:opacity-90"
                style={{ backgroundColor: getModalColor() }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {modalConfig.type === "success" ? "Go to My Garden" : "Close"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
                  <View className="w-28 h-28 bg-[#E8F5E9]/80 rounded-full items-center justify-center border-4 border-white/30 shadow-sm overflow-hidden relative">
                    {photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Camera size={40} color="#5F7A4B" />
                    )}
                    {photoUri && (
                      <View className="absolute bottom-0 bg-black/40 w-full h-8 items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">
                          EDIT
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text className="text-white text-lg font-bold shadow-sm">
                      {photoUri ? "Nice photo!" : "Add a photo"}
                    </Text>
                    <Text className="text-gray-200 text-sm">
                      {photoUri ? "Tap to change" : "Tap to upload"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View className="bg-[#E8E6DE]/95 flex-1 rounded-t-[35px] px-6 pt-8 pb-10 min-h-[650px]">
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  <Text className="text-[#1F2937] font-bold text-base mb-1">
                    Plant Name
                  </Text>
                  <TextInput
                    placeholder="e.g. My plant"
                    placeholderTextColor="#9CA3AF"
                    value={plantName}
                    onChangeText={setPlantName}
                    className="text-base text-[#1F2937] p-0"
                  />
                </View>
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
                    <Text className="text-gray-500 text-base font-medium">
                      Set Reminders
                    </Text>
                    <Switch
                      trackColor={{ false: "#6fa57677", true: "#5e7c46ff" }}
                      thumbColor={"#FFFFFF"}
                      ios_backgroundColor="#D1D1D6"
                      onValueChange={setRemindersEnabled}
                      value={remindersEnabled}
                    />
                  </View>
                  {remindersEnabled && (
                    <View className="mb-2">
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[#1F2937] font-medium">
                          Every
                        </Text>
                        <View className="flex-row items-center">
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setWateringIntervalDays((d) => Math.max(1, d - 1))
                            }
                            className="w-10 h-10 bg-[#F9F9F9] rounded-xl items-center justify-center border border-gray-100"
                          >
                            <Text className="text-[#1F2937] font-bold text-lg">
                              -
                            </Text>
                          </TouchableOpacity>
                          <View className="mx-3 min-w-[44px] items-center">
                            <Text className="text-[#1F2937] font-bold text-base">
                              {wateringIntervalDays}
                            </Text>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() =>
                              setWateringIntervalDays((d) =>
                                Math.min(30, d + 1),
                              )
                            }
                            className="w-10 h-10 bg-[#F9F9F9] rounded-xl items-center justify-center border border-gray-100"
                          >
                            <Text className="text-[#1F2937] font-bold text-lg">
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text className="text-[#1F2937] font-medium">days</Text>
                      </View>
                      <View className="bg-[#F9F9F9] border border-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between">
                        <View>
                          <Text className="text-gray-500 text-xs mb-1">
                            Preferred time
                          </Text>
                          <TextInput
                            value={wateringTime}
                            onChangeText={handleTimeChange}
                            placeholder="20:00"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad"
                            maxLength={5}
                            className="text-[#1F2937] font-bold text-lg p-0"
                          />
                        </View>
                        <Clock size={24} color="#5F7A4B" />
                      </View>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  className={`py-4 rounded-2xl items-center mt-auto mb-6 border border-white/30 flex-row justify-center ${
                    isSaveDisabled
                      ? "bg-[#6B8E4E] opacity-50 shadow-none"
                      : "bg-[#6B8E4E] shadow-md"
                  }`}
                  activeOpacity={isSaveDisabled ? 1 : 0.85}
                  onPress={handleSave}
                  disabled={isSaveDisabled}
                >
                  {loading ? (
                    <ActivityIndicator color="white" className="mr-2" />
                  ) : null}
                  <Text
                    className={`font-bold text-lg ${isSaveDisabled ? "text-white/80" : "text-white"}`}
                  >
                    {loading ? "Planting..." : "Save Plant"}
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
