import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../context/I18nContext";

const AiIdentifier = () => {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/aiHelper");
  };

  const openCamera = async () => {
    if (Platform.OS === "web") {
      showModal(t("identifier.notSupported"), t("identifier.notSupportedMsg"));
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      showModal(t("identifier.permissionNeeded"), t("identifier.cameraPermission"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      showModal(t("identifier.permissionNeeded"), t("identifier.galleryPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!selectedImage) {
      showModal(t("identifier.noPhoto"), t("identifier.noPhotoMsg"));
      return;
    }

    showModal(t("identifier.submitted"), t("identifier.submittedMsg"));
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
        <View className="px-4 mt-2 mb-3">
          <View className="bg-white/15 border border-white/20 rounded-2xl px-3 py-3 flex-row items-center">
            <TouchableOpacity
              onPress={handleGoBack}
              activeOpacity={0.8}
              className="w-10 h-10 rounded-xl bg-white/25 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>

            <View className="flex-1 px-3">
              <Text className="text-white/80 text-xs font-medium tracking-wide uppercase">
                {t("ai.helper.title")}
              </Text>
              <Text className="text-white text-2xl font-bold">{t("identifier.title")}</Text>
            </View>

            <View className="w-10 h-10" />
          </View>
        </View>

        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px]">
          <ScrollView
            className="flex-1 px-5 pt-1 mt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 15 }}
          >
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-[#D8D5CB]">
              <Text className="text-[#1F2937] text-lg font-bold mb-1">{t("identifier.chooseSource")}</Text>
              <Text className="text-[#6B7280] mt-1 mb-4">
                {t("identifier.chooseSourceMsg")}
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={openGallery}
                  className="flex-1 rounded-2xl p-4 border border-[#D8D5CB] bg-[#F9FAFB]"
                  activeOpacity={0.85}
                >
                  <View className="w-11 h-11 rounded-full bg-[#5F7A4B]/15 items-center justify-center mb-3">
                    <Ionicons name="images-outline" size={22} color="#5F7A4B" />
                  </View>
                  <Text className="text-[#1F2937] font-bold text-base">{t("identifier.gallery")}</Text>
                  <Text className="text-[#6B7280] text-xs mt-1 leading-4">
                    {t("identifier.galleryDesc")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openCamera}
                  className="flex-1 rounded-2xl p-4 border border-[#D8D5CB] bg-[#F9FAFB]"
                  activeOpacity={0.85}
                >
                  <View className="w-11 h-11 rounded-full bg-[#5F7A4B]/15 items-center justify-center mb-3">
                    <Ionicons name="camera-outline" size={22} color="#5F7A4B" />
                  </View>
                  <Text className="text-[#1F2937] font-bold text-base">{t("identifier.camera")}</Text>
                  <Text className="text-[#6B7280] text-xs mt-1 leading-4">
                    {t("identifier.cameraDesc")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedImage && (
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-[#D8D5CB]">
                <Text className="text-[#1F2937] text-base font-semibold mb-3">{t("identifier.selectedPhoto")}</Text>
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: 260, borderRadius: 14 }}
                  resizeMode="cover"
                />

                <View className="mt-3 gap-3">
                  <TouchableOpacity
                    onPress={handleSubmit}
                    className="rounded-xl py-3.5 flex-row items-center justify-center bg-[#5F7A4B]"
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-white font-bold text-base">{t("identifier.submit")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRemoveModalVisible(true)}
                    className="rounded-xl py-3.5 flex-row items-center justify-center bg-[#8C8673]"
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-white font-bold text-base">{t("identifier.remove")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View className="h-8" />
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl"
          >
            <View className="w-16 h-16 rounded-full items-center justify-center mb-5 bg-[#5F7A4B]">
              <Ionicons name="information" size={32} color="white" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-2 text-center">
              {modalTitle}
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-2 text-base leading-6">
              {modalMessage}
            </Text>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="w-full py-3.5 rounded-xl shadow-sm active:opacity-90 bg-[#5F7A4B]"
            >
              <Text className="text-white text-center font-bold text-lg">{t("identifier.close")}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={removeModalVisible}
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setRemoveModalVisible(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl"
          >
            <View className="w-16 h-16 rounded-full items-center justify-center mb-5 bg-[#ef4444]">
              <Ionicons name="trash" size={30} color="white" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-2 text-center">
              {t("identifier.removeQuestion")}
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-2 text-base leading-6">
              {t("identifier.removeMsg")}
            </Text>

            <View className="w-full gap-3">
              <TouchableOpacity
                onPress={() => {
                  setSelectedImage(null);
                  setRemoveModalVisible(false);
                }}
                className="w-full py-3.5 rounded-xl shadow-sm active:opacity-90 bg-[#ef4444]"
              >
                <Text className="text-white text-center font-bold text-lg">{t("identifier.remove")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRemoveModalVisible(false)}
                className="w-full py-3.5 rounded-xl shadow-sm active:opacity-90 bg-[#5F7A4B]"
              >
                <Text className="text-white text-center font-bold text-lg">{t("account.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AiIdentifier;
