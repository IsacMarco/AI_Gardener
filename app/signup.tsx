import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import {getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "@react-native-firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { X } from "lucide-react-native";
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
  const [modalVisible, setModalVisible] = useState(false);
  const [signUpStatus, setSignUpStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  const handleSignUp = async () => {
    setSignUpStatus("loading");
    setModalVisible(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      await signOut(auth);
      setSignUpStatus("success");
    } catch (e: any) {
      const err = e as FirebaseError;
      setSignUpStatus("error");
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
                  <TextInput
                    className="bg-white rounded-xl h-12 px-4 mb-4 text-base text-gray-800"
                    placeholder="Password"
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
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
                    className="bg-white h-12 rounded-xl justify-center items-center"
                    style={{ width: "48%" }}
                    onPress={handleSignUp}
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
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={handleCloseModal}
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
            {signUpStatus === "success" && (
              <>
                <View className="mb-6 mt-4 items-center">
                  <Text className="text-xl font-bold text-[#1F2937] mb-2">
                    Account Created Successfully
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-full bg-green-100 py-4 rounded-full items-center mb-4 shadow-sm border border-white/50"
                  onPress={handleGoToLogin}
                >
                  <Text className="text-[#1F2937] font-bold text-base">
                    Go to Log In
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {signUpStatus === "error" && (
              <>
                <View className="mb-6 mt-4 items-center">
                  <Text className="text-xl font-bold text-[#1F2937] mb-2">
                    Sign Up Failed
                  </Text>
                  <Text className="text-center text-gray-600">
                    An error occurred during sign up. Please try again.
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-full bg-red-100 py-4 rounded-full items-center mb-4 shadow-sm border border-white/50"
                  onPress={handleCloseModal}
                >
                  <Text className="text-[#1F2937] font-bold text-base">
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {signUpStatus === "loading" && (
              <View>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text>Se creeaza contul...</Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
