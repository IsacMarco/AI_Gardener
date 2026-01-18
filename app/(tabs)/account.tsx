import { Ionicons } from "@expo/vector-icons";
import auth, { FirebaseAuthTypes, signOut } from "@react-native-firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Edit2,
  Globe,
  HelpCircle,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

// --- COMPONENTE MICI PENTRU UI ---

// 1. Card de Statistică (Gamification)
const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) => (
  <View className="items-center bg-white/20 p-3 rounded-2xl w-[30%] border border-white/20 backdrop-blur-md">
    {icon}
    <Text className="text-white font-bold text-lg mt-1 shadow-sm">{value}</Text>
    <Text className="text-white/80 text-xs font-medium">{label}</Text>
  </View>
);

// 2. Element de listă pentru Setări
const SettingItem = ({
  icon,
  label,
  value,
  isSwitch,
  switchValue,
  onSwitch,
  isLast,
}: any) => (
  <TouchableOpacity
    activeOpacity={isSwitch ? 1 : 0.7}
    onPress={!isSwitch ? () => {} : undefined}
    className={`flex-row items-center py-4 ${!isLast ? "border-b border-gray-100" : ""}`}
  >
    <View className="w-10 h-10 bg-[#F5F7F4] rounded-full items-center justify-center mr-4">
      {icon}
    </View>
    <Text className="text-[#1F2937] text-base font-semibold flex-1">
      {label}
    </Text>

    {isSwitch ? (
      <Switch
        trackColor={{ false: "#E5E7EB", true: "#5F7A4B" }}
        thumbColor={"#FFFFFF"}
        ios_backgroundColor="#E5E7EB"
        onValueChange={onSwitch}
        value={switchValue}
      />
    ) : (
      <View className="flex-row items-center">
        {value && <Text className="text-gray-400 mr-2 text-sm">{value}</Text>}
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    )}
  </TouchableOpacity>
);

// --- ECRAN PRINCIPAL ---

const AccountScreen = () => {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Verificare User
  useEffect(() => {
    const currentUser = auth().currentUser;
    setUser(currentUser);
  }, []);

  // Logout Logic
  const handleFirebaseLogout = async () => {
    try {
      setLogoutModalVisible(false);
      await signOut(auth());
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Render dacă nu e logat
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LinearGradient
          colors={["#5F7A4B", "#8C8673", "#AFA696"]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <Text className="text-white text-lg font-bold shadow-sm">
          Please log in to view your account.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="mt-6 bg-white px-8 py-3 rounded-full shadow-lg"
        >
          <Text className="text-[#5F7A4B] font-bold text-lg">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F2F1ED]">
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: height * 0.55,
        }}
      />

      <SafeAreaView className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-5 mt-2 mb-4">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-white tracking-wide">
              Profile
            </Text>
            <TouchableOpacity className="w-10 h-10 opacity-0">
              {/* Spacer invizibil pt centrare */}
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View className="items-center">
            <View className="relative">
              <View className="w-28 h-28 bg-[#A4B58E] rounded-full items-center justify-center border-[3px] border-white/40 shadow-xl mb-4">
                {user.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <User size={50} color="white" fill="#cddbad" />
                )}
              </View>
              <TouchableOpacity className="absolute bottom-4 right-0 bg-white p-2 rounded-full shadow-md">
                <Edit2 size={16} color="#5F7A4B" />
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold text-white shadow-sm mb-1">
              {user.displayName || "Gardener"}
            </Text>
            <Text className="text-white/80 font-medium text-sm mb-6">
              {user.email}
            </Text>
          </View>
        </View>

        {/* --- SETTINGS CONTENT --- */}
        <View className="flex-1 bg-[#F2F1ED] rounded-t-[40px] shadow-2xl overflow-hidden mt-4">
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-gray-500 font-bold uppercase text-xs mb-3 ml-2 tracking-wider">
              Preferences
            </Text>

            <View className="bg-white rounded-3xl px-5 mb-8 shadow-sm">
              <SettingItem
                icon={<Bell size={20} color="#5F7A4B" />}
                label="Notifications"
                isSwitch={true}
                switchValue={notificationsEnabled}
                onSwitch={() => setNotificationsEnabled(!notificationsEnabled)}
              />
              {/* <SettingItem
                icon={<Moon size={20} color="#6B7280" />}
                label="Dark Mode"
                isSwitch={true}
                switchValue={darkModeEnabled}
                onSwitch={() => setDarkModeEnabled(!darkModeEnabled)}
              /> */}
              <SettingItem
                icon={<Globe size={20} color="#3B82F6" />}
                label="Language"
                value="English"
              />
              {/* <SettingItem
                icon={<Thermometer size={20} color="#EF4444" />}
                label="Units"
                value="Celsius (°C)"
                isLast={true}
              /> */}
            </View>
            <Text className="text-gray-500 font-bold uppercase text-xs mb-3 ml-2 tracking-wider">
              Support
            </Text>
            <View className="bg-white rounded-3xl px-5 mb-8 shadow-sm">
              <SettingItem
                icon={<HelpCircle size={20} color="#F59E0B" />}
                label="Help Center"
              />
              <SettingItem
                icon={<ShieldCheck size={20} color="#10B981" />}
                label="Privacy Policy"
                isLast={true}
              />
            </View>

            {/* LOGOUT BUTTON */}
            <TouchableOpacity
              onPress={() => setLogoutModalVisible(true)}
              className="flex-row items-center justify-center bg-white border border-red-100 p-4 rounded-2xl shadow-sm mb-6"
            >
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-500 font-bold text-lg ml-3">
                Log Out
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-gray-400 text-xs">
              AI Gardener v1.0.0
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
      {/* --- MODAL LOGOUT --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-5">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
                <LogOut size={20} color="#EF4444" />
              </View>
            </View>

            <Text className="text-xl font-bold text-gray-800 mb-2">
              Log Out?
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-4 leading-5">
              Are you sure you want to leave? Your plants will miss you!
            </Text>

            <View className="flex-row w-full gap-3">
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                className="bg-gray-100 flex-1 py-3.5 rounded-xl"
              >
                <Text className="text-gray-700 text-center font-bold text-lg">
                  Stay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFirebaseLogout}
                className="bg-red-500 flex-1 py-3.5 rounded-xl shadow-md shadow-red-200"
              >
                <Text className="text-white text-center font-bold text-lg">
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AccountScreen;
