import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import {
  fetchSignInMethodsForEmail,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
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
const auth = getAuth();

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSignupAction, setShowSignupAction] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logInStatus, setLogInStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPassword = password.length >= 6;
  const canLogin = isValidEmail && isValidPassword && logInStatus !== "loading";

  const handleCloseModal = () => {
    setModalVisible(false);
    setShowSignupAction(false);
    setLogInStatus("idle");
  };

  const handleGoToSignup = () => {
    setModalVisible(false);
    setShowSignupAction(false);
    setLogInStatus("idle");
    router.push("/signup");
  };

  const getLoginErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return t("auth.login.err.invalidPassword");
      case "auth/user-not-found":
        return t("auth.login.err.userNotFound");
      case "auth/invalid-email":
        return t("auth.login.err.invalidEmail");
      case "auth/too-many-requests":
        return t("auth.login.err.tooMany");
      case "auth/network-request-failed":
        return t("auth.login.err.network");
      default:
        return t("auth.login.err.generic");
    }
  };

  // --- LOGIN CU EMAIL ---
  const handleLogin = async () => {
    setLogInStatus("loading");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setLogInStatus("idle");
    } catch (error: any) {
      let normalizedCode = error?.code as string | undefined;

      if (
        normalizedCode === "auth/invalid-credential" ||
        normalizedCode === "auth/wrong-password"
      ) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email.trim());
          normalizedCode = methods.length === 0 ? "auth/user-not-found" : "auth/wrong-password";
        } catch {
          // If this lookup fails, keep original code.
        }
      }

      if (error?.code !== "auth/invalid-credential") {
        console.warn("Login error:", error?.code || error?.message || error);
      }
      setLogInStatus("error");
      setShowSignupAction(normalizedCode === "auth/user-not-found");
      setErrorMessage(getLoginErrorMessage(normalizedCode));
      setModalVisible(true);
    }
  };
  // --- LOGIN CU GOOGLE ---
  const onGoogleButtonPress = async () => {
    setLogInStatus("loading");
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      const result: any = response;
      const idToken = result.data?.idToken || result.idToken;
      if (!idToken) {
        throw new Error("No Google ID Token found!");
      }
      // 4. Cream credentialul pentru Firebase
      const googleCredential = GoogleAuthProvider.credential(idToken);
      // 5. Logam userul in Firebase folosind instanta modulara (getAuth)
      const authInstance = getAuth();
      await signInWithCredential(authInstance, googleCredential);
      // 6. Daca ajunge aici, login-ul a reusit
      setLogInStatus("idle");
    } catch (error: any) {
      console.error("Google Sign In Error:", error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Userul a inchis fereastra de Google, oprim doar loading-ul
        setLogInStatus("idle");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operatiunea e deja in curs, nu facem nimic
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setLogInStatus("error");
        setErrorMessage(t("auth.login.err.playServices"));
        setModalVisible(true);
      } else {
        // Orice alta eroare
        setLogInStatus("error");
        setErrorMessage(
          error.message || t("auth.login.err.googleGeneric"),
        );
        setModalVisible(true);
      }
    }
  };

  return (
    <>
      <View className="flex-1">
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#5F7A4B", "#8C8673", "#AFA696"]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-between"
          >
            <View className="items-center" style={{ marginTop: height * 0.08 }}>
              <Image
                source={require("../assets/images/logo.png")}
                className="w-41 h-40"
                resizeMode="contain"
              />
            </View>

            <View
              className="bg-white/55 rounded-t-[30px] px-8 pt-10 pb-10 justify-start"
              style={{ height: height * 0.6 }}
            >
              <Text className="text-3xl font-bold text-white mb-8">
                {t("auth.login.welcome")}
              </Text>

              <View className="mb-5">
                <TextInput
                  className="bg-white rounded-xl h-12 px-4 mb-4 text-base text-gray-800"
                  placeholder={t("auth.login.email")}
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View className="relative mb-4">
                  <TextInput
                    className="bg-white rounded-xl h-12 px-4 pr-12 text-base text-gray-800"
                    placeholder={t("auth.login.password")}
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-0 h-12 justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  className={`h-14 rounded-xl justify-center items-center px-2 ${canLogin ? "bg-white" : "bg-white/60"}`}
                  style={{ width: "48%" }}
                  onPress={handleLogin}
                  disabled={!canLogin}
                >
                  {logInStatus === "loading" ? (
                    <ActivityIndicator color="#5F7A4B" />
                  ) : (
                    <Text numberOfLines={2} className="text-gray-600 font-bold text-sm text-center">
                      {t("auth.login.logIn")}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-transparent border border-white h-14 rounded-xl justify-center items-center px-2"
                  style={{ width: "48%" }}
                  onPress={() => router.push("/signup")}
                >
                  <Text numberOfLines={2} className="text-white font-bold text-sm text-center">
                    {t("auth.login.signUp")}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{
                  alignSelf: "flex-start",
                }}
                onPress={() => router.push("/forgotpass")}
              >
                <Text className="text-gray-500 text-sm mb-10">
                  {t("auth.login.forgotPassword")}
                </Text>
              </TouchableOpacity>

              <View className="items-center">
                <Text className="text-gray-500 mb-5 text-sm">
                  {t("auth.login.orContinue")}
                </Text>

                <View className="flex-row gap-5">
                  <TouchableOpacity
                    onPress={onGoogleButtonPress}
                    className="w-12 h-12 rounded-full bg-white justify-center items-center shadow-md"
                  >
                    <AntDesign name="google" size={24} color="#EA4335" />
                  </TouchableOpacity>

                  <TouchableOpacity className="w-12 h-12 rounded-full bg-[#3b5998] justify-center items-center shadow-md">
                    <FontAwesome name="facebook-f" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-[32px] p-8 shadow-2xl items-center relative">
            <TouchableOpacity
              onPress={handleCloseModal}
              className="absolute right-6 top-6"
            >
              <X size={25} color="#9CA3AF" />
            </TouchableOpacity>

            {logInStatus === "error" && (
              <>
                <View className="mb-6 mt-4 items-center">
                  <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                    <X size={32} color="#EF4444" />
                  </View>
                  <Text className="text-xl font-bold text-[#1F2937]">
                    {t("auth.login.failed")}
                  </Text>
                  <Text className="text-center text-gray-600 mt-2">
                    {errorMessage}
                  </Text>
                </View>
                <TouchableOpacity
                  className={`w-full py-4 rounded-full items-center shadow-sm ${showSignupAction ? "bg-[#5F7A4B]" : "bg-gray-100"}`}
                  onPress={showSignupAction ? handleGoToSignup : handleCloseModal}
                >
                  <Text
                    numberOfLines={2}
                    className={`font-bold text-base text-center px-2 ${showSignupAction ? "text-white" : "text-[#1F2937]"}`}
                  >
                    {showSignupAction
                      ? t("auth.login.createAccount")
                      : t("auth.login.tryAgain")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
