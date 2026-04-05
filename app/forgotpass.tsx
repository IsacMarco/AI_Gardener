import { Ionicons } from "@expo/vector-icons";
import auth, { sendPasswordResetEmail } from "@react-native-firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../context/I18nContext";

const { height } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    title: "",
    message: "",
    type: "success",
  });
  // Functie pentru afisarea modalului cu continut personalizat
  const showModal = (
    title: string,
    message: string,
    type: "success" | "error",
  ) => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  };

  // Functie pentru inchiderea modalului
  const handleCloseModal = () => {
    setModalVisible(false);
    if (modalContent.type === "success") {
      router.back();
    }
  };

  // Logica principala de Resetare
  const handleReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showModal(
        t("auth.forgot.missingEmail"),
        t("auth.forgot.missingEmailMsg"),
        "error",
      );
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      showModal(t("auth.forgot.invalidEmail"), t("auth.forgot.invalidEmailMsg"), "error");
      return;
    }

    setLoading(true);
    try {
      const signInMethods = await auth().fetchSignInMethodsForEmail(
        normalizedEmail,
      );

      if (!signInMethods || signInMethods.length === 0) {
        showModal(
          t("auth.forgot.accountNotFound"),
          t("auth.forgot.accountNotFoundMsg"),
          "error",
        );
        return;
      }

      await sendPasswordResetEmail(auth(), normalizedEmail);
      showModal(
        t("auth.forgot.checkInbox"),
        t("auth.forgot.checkInboxMsg", { email: normalizedEmail }),
        "success",
      );
    } catch (error: any) {
      console.warn("Forgot password error:", error?.code || error?.message || error);
      let msg = t("auth.forgot.err.generic");
      if (error.code === "auth/invalid-email") {
        msg = t("auth.forgot.err.invalidFormat");
      } else if (error.code === "auth/user-not-found") {
        msg = t("auth.forgot.accountNotFoundMsg");
      }
      showModal(t("common.error"), msg, "error");
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
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-[24px] p-6 items-center shadow-2xl">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${modalContent.type === "success" ? "bg-green-100" : "bg-red-100"}`}
            >
              <Ionicons
                name={
                  modalContent.type === "success"
                    ? "mail-unread"
                    : "alert-circle"
                }
                size={32}
                color={modalContent.type === "success" ? "#5F7A4B" : "#ef4444"}
              />
            </View>

            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
              {modalContent.title}
            </Text>

            <Text className="text-gray-500 text-center mb-8 leading-5 px-2">
              {modalContent.message}
            </Text>

            <TouchableOpacity
              onPress={handleCloseModal}
              className={`w-full py-3.5 rounded-xl ${modalContent.type === "success" ? "bg-[#5F7A4B]" : "bg-red-500"}`}
              activeOpacity={0.8}
            >
              <Text numberOfLines={2} className="text-white text-center font-bold text-base px-2">
                {modalContent.type === "success"
                  ? t("auth.forgot.backToLogin")
                  : t("auth.login.tryAgain")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView className="flex-1">
        <View className="px-5 mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-between">
          <View className="items-center" style={{ marginTop: height * 0.05 }}>
            <Image
              source={require("../assets/images/logo.png")} // Asigura-te ca calea e corecta
              className="w-48 h-48"
              resizeMode="contain"
            />
          </View>

          <View
            className="bg-white/25 rounded-t-[35px] px-8 pt-10 pb-10 justify-start backdrop-blur-sm"
            style={{ height: height * 0.55 }}
          >
            <Text className="text-3xl font-bold text-white mb-3 shadow-sm">
              {t("auth.forgot.title")}
            </Text>
            <Text className="text-gray-100 text-base mb-8 leading-6 opacity-90">
              {t("auth.forgot.subtitle")}
            </Text>

            <View className="mb-8">
              <TextInput
                className="bg-white rounded-xl h-14 px-4 text-base text-gray-800 shadow-sm"
                placeholder={t("auth.forgot.emailAddress")}
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              className="bg-white h-14 rounded-xl justify-center items-center mb-6 shadow-md"
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#5F7A4B" size="small" />
              ) : (
                <Text numberOfLines={2} className="text-[#5F7A4B] font-extrabold text-base text-center px-3">
                  {t("auth.forgot.send")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
