import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import {getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "@react-native-firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { AlertCircle, CheckCircle2, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const { height } = Dimensions.get("window");
const auth = getAuth();
export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [signUpErrorMessage, setSignUpErrorMessage] = useState("");
  const [signUpStatus, setSignUpStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSignUp =
    fullName.trim().length > 0 &&
    isEmailValid &&
    hasMinLength &&
    hasUppercase &&
    hasDigit &&
    hasSpecialChar &&
    passwordsMatch;
  const handleCloseModal = () => {
    setModalVisible(false);
    setSignUpStatus("idle");
  };
  const handleSignUp = async () => {
    if (!canSignUp) {
      return;
    }

    setSignUpStatus("loading");
    setModalVisible(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      await signOut(auth);
      setSignUpStatus("success");
    } catch (e: any) {
      const err = e as FirebaseError;
      setSignUpStatus("error");
      if (err.code === "auth/email-already-in-use") {
        setSignUpErrorMessage("This email is already used by another account.");
      } else if (err.code === "auth/invalid-email") {
        setSignUpErrorMessage("Please enter a valid email address.");
      } else if (err.code === "auth/network-request-failed") {
        setSignUpErrorMessage("Network error. Please check your connection and try again.");
      } else {
        setSignUpErrorMessage("An error occurred during sign up. Please try again.");
      }
    }
  };

  const handleGoToLogin = () => {
    // Mergem inapoi la ecranul de Login
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
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
          <View className="px-5 mt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "space-between",
              }}
            >
              <View className="items-center my-8">
                <Image
                  source={require("../assets/images/logo.png")}
                  className="w-41 h-40"
                  resizeMode="contain"
                />
              </View>

              <View
                className="bg-white/55 rounded-t-[30px] px-8 pt-8 pb-10 justify-start"
                style={{ minHeight: height * 0.65 }}
              >
                <Text className="text-3xl font-bold text-white mb-6">
                  Create Account
                </Text>

                <View className="mb-5">
                  <TextInput
                    className="bg-white rounded-xl h-12 px-4 mb-4 text-base text-gray-800"
                    placeholder="Full Name"
                    placeholderTextColor="#A0A0A0"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                  <TextInput
                    className="bg-white rounded-xl h-12 px-4 mb-4 text-base text-gray-800"
                    placeholder="Email"
                    placeholderTextColor="#A0A0A0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <View className="relative mb-3">
                    <TextInput
                      className="bg-white rounded-xl h-12 px-4 pr-12 text-base text-gray-800"
                      placeholder="Password"
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

                  <View className="relative mb-4">
                    <TextInput
                      className="bg-white rounded-xl h-12 px-4 pr-12 text-base text-gray-800"
                      placeholder="Confirm Password"
                      placeholderTextColor="#A0A0A0"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-0 h-12 justify-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>

                  <View className="bg-white/65 rounded-xl px-4 py-3 mb-2">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Password requirements
                    </Text>

                    <Text className={`${hasMinLength ? "text-green-700" : "text-gray-500"}`}>
                      {hasMinLength ? "✓" : "•"} At least 6 characters
                    </Text>
                    <Text className={`${hasUppercase ? "text-green-700" : "text-gray-500"}`}>
                      {hasUppercase ? "✓" : "•"} At least one uppercase letter
                    </Text>
                    <Text className={`${hasDigit ? "text-green-700" : "text-gray-500"}`}>
                      {hasDigit ? "✓" : "•"} At least one number
                    </Text>
                    <Text className={`${hasSpecialChar ? "text-green-700" : "text-gray-500"}`}>
                      {hasSpecialChar ? "✓" : "•"} At least one special character
                    </Text>
                    <Text className={`${passwordsMatch ? "text-green-700" : "text-gray-500"}`}>
                      {passwordsMatch ? "✓" : "•"} Passwords match
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between mb-6">
                  <TouchableOpacity
                    className="bg-transparent borderkq border-white border h-12 rounded-xl justify-center items-center"
                    style={{ width: "48%" }}
                    onPress={handleGoToLogin}
                  >
                    <Text className="text-white font-bold text-base">
                      Log In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`h-12 rounded-xl justify-center items-center ${canSignUp ? "bg-white" : "bg-white/60"}`}
                    style={{ width: "48%" }}
                    onPress={handleSignUp}
                    disabled={!canSignUp}
                  >
                    <Text className="text-gray-600 font-bold text-base">
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="items-center mt-2">
                  <Text className="text-gray-500 mb-4 text-sm">
                    or sign up with
                  </Text>

                  <View className="flex-row gap-5">
                    <TouchableOpacity className="w-12 h-12 rounded-full bg-white justify-center items-center shadow-md">
                      <AntDesign name="google" size={24} color="#EA4335" />
                    </TouchableOpacity>

                    <TouchableOpacity className="w-12 h-12 rounded-full bg-[#3b5998] justify-center items-center shadow-md">
                      <FontAwesome name="facebook-f" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (signUpStatus !== "loading") {
            handleCloseModal();
          }
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => {
            if (signUpStatus !== "loading") {
              handleCloseModal();
            }
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: "85%",
              borderRadius: 32,
              backgroundColor: "white",
              padding: 24,
            }}
            className="bg-white rounded-[32px] p-6 shadow-2xl items-center"
          >
            {signUpStatus !== "loading" && (
              <TouchableOpacity
                onPress={handleCloseModal}
                style={{
                  position: "absolute",
                  width: "100%",
                  alignItems: "flex-end",
                  paddingTop: 8,
                }}
              >
                <X size={25} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {signUpStatus === "success" && (
              <>
                <View className="mb-6 mt-4 items-center">
                  <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                    <CheckCircle2 size={34} color="#16A34A" />
                  </View>
                  <Text className="text-xl font-bold text-[#1F2937] mb-2">
                    Account Created
                  </Text>
                  <Text className="text-center text-gray-600 px-2">
                    Your account was created successfully. You can now log in.
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-full bg-[#5F7A4B] py-4 rounded-full items-center mb-4 shadow-sm"
                  onPress={handleGoToLogin}
                >
                  <Text className="text-white font-bold text-base">
                    Go to Log In
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {signUpStatus === "error" && (
              <>
                <View className="mb-6 mt-4 items-center">
                  <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                    <AlertCircle size={34} color="#EF4444" />
                  </View>
                  <Text className="text-xl font-bold text-[#1F2937] mb-2">
                    Sign Up Failed
                  </Text>
                  <Text className="text-center text-gray-600 px-2">
                    {signUpErrorMessage}
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-full bg-gray-100 py-4 rounded-full items-center mb-4 shadow-sm"
                  onPress={handleCloseModal}
                >
                  <Text className="text-[#1F2937] font-bold text-base">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {signUpStatus === "loading" && (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text className="text-[#1F2937] font-semibold mt-4 text-base">
                  Creating your account...
                </Text>
                <Text className="text-gray-500 mt-1 text-center px-3">
                  Please wait a moment.
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
