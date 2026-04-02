import { getAuth, FirebaseAuthTypes, signOut } from "@react-native-firebase/auth";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  areGlobalNotificationsEnabled,
  scheduleWateringNotification,
  setGlobalNotificationsEnabled,
} from "../../services/notifications";
import { usePlants } from "../../context/PlantContext";
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
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
const auth = getAuth();

const LANGUAGE_OPTIONS = [
  { code: "en-US", label: "English", short: "EN" },
  { code: "ro-RO", label: "Română", short: "RO" },
  { code: "es-ES", label: "Español", short: "ES" },
  { code: "fr-FR", label: "Français", short: "FR" },
  { code: "de-DE", label: "Deutsch", short: "DE" },
  { code: "it-IT", label: "Italiano", short: "IT" },
  { code: "pt-BR", label: "Português", short: "PT" },
];

// 2. Element de lista pentru Setari
const SettingItem = ({
  icon,
  label,
  value,
  isSwitch,
  switchValue,
  onSwitch,
  onPress,
  isLast,
}: any) => (
  <TouchableOpacity
    activeOpacity={isSwitch ? 1 : 0.7}
    onPress={!isSwitch ? onPress : undefined}
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

const AccountScreen = () => {
  const router = useRouter();
  const { plants } = usePlants();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(
    LANGUAGE_OPTIONS[0],
  );
  const helpSheetRef = useRef<BottomSheetModal>(null);
  const privacySheetRef = useRef<BottomSheetModal>(null);

  const supportSheetSnapPoints = useMemo(() => ["80%"], []);

  const renderSheetBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.45}
      />
    ),
    [],
  );

  const openHelpSheet = useCallback(() => {
    helpSheetRef.current?.present();
  }, []);

  const openPrivacySheet = useCallback(() => {
    privacySheetRef.current?.present();
  }, []);

  useEffect(() => {
    const initializeAccountState = async () => {
      const currentUser = auth.currentUser;
      setUser(currentUser);

      const { status } = await Notifications.getPermissionsAsync();
      const isEnabled =
        status === "granted" && areGlobalNotificationsEnabled();

      setNotificationsEnabled(isEnabled);
      setGlobalNotificationsEnabled(isEnabled);
    };

    initializeAccountState();
  }, []);

  const scheduleEnabledPlantNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const plant of plants) {
      if (plant.watering?.enabled) {
        await scheduleWateringNotification(
          plant.name,
          plant.watering.frequency,
          plant.watering.time,
        );
      }
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      setGlobalNotificationsEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();

    if (status === "granted") {
      setNotificationsEnabled(true);
      setGlobalNotificationsEnabled(true);
      await scheduleEnabledPlantNotifications();
      return;
    }

    const { status: requestedStatus } =
      await Notifications.requestPermissionsAsync();

    if (requestedStatus === "granted") {
      setNotificationsEnabled(true);
      setGlobalNotificationsEnabled(true);
      await scheduleEnabledPlantNotifications();
      return;
    }

    setNotificationsEnabled(false);
    setGlobalNotificationsEnabled(false);
    setNotificationsModalVisible(true);
  };

  const handleContactUs = async () => {
    const supportEmail =
      process.env.EXPO_PUBLIC_CONTACT_EMAIL || "support@aigardener.app";
    const mailUrl = `mailto:${supportEmail}`;

    await Linking.openURL(mailUrl);
  };

  // --- UPDATED LOGOUT LOGIC ---
  const handleFirebaseLogout = async () => {
    try {
      setLogoutModalVisible(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("🔒 Notifications cleared for logout.");
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
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
    <BottomSheetModalProvider>
      <View className="flex-1 bg-[#F2F1ED]">
      <StatusBar barStyle="light-content" />

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
        <View className="px-5 mt-4 mb-4">
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-white tracking-wide">
              Profile
            </Text>
          </View>

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

        <View className="flex-1 bg-[#F2F1ED] rounded-t-[40px] shadow-2xl overflow-hidden mt-4 mb-12">
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
                onSwitch={handleNotificationsToggle}
              />
              <SettingItem
                icon={<Globe size={20} color="#3B82F6" />}
                label="Language"
                value={selectedLanguage.label}
                onPress={() => setLanguageModalVisible(true)}
              />
            </View>
            <Text className="text-gray-500 font-bold uppercase text-xs mb-3 ml-2 tracking-wider">
              Support
            </Text>
            <View className="bg-white rounded-3xl px-5 mb-8 shadow-sm">
              <SettingItem
                icon={<HelpCircle size={20} color="#F59E0B" />}
                label="Help Center"
                onPress={openHelpSheet}
              />
              <SettingItem
                icon={<ShieldCheck size={20} color="#10B981" />}
                label="Privacy Policy"
                onPress={openPrivacySheet}
                isLast={true}
              />
            </View>

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

      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl">
            <View className="w-16 h-16 bg-amber-50 rounded-full items-center justify-center mb-5">
              <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                <Bell size={20} color="#F59E0B" />
              </View>
            </View>

            <Text className="text-xl font-bold text-gray-800 mb-2">
              Notifications Disabled
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-4 leading-5">
              Enable notifications from system settings to receive watering reminders.
            </Text>

            <View className="flex-row w-full gap-3">
              <TouchableOpacity
                onPress={() => setNotificationsModalVisible(false)}
                className="bg-gray-100 flex-1 py-3.5 rounded-xl"
              >
                <Text className="text-gray-700 text-center font-bold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  setNotificationsModalVisible(false);
                  await Linking.openSettings();
                }}
                className="bg-[#5F7A4B] flex-1 py-3.5 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-lg">
                  Open Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl"
          >
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-5 self-center">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Globe size={20} color="#3B82F6" />
              </View>
            </View>

            <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
              Select Language
            </Text>

            <View className="gap-2">
              {LANGUAGE_OPTIONS.map((language) => {
                const isSelected = selectedLanguage.code === language.code;

                return (
                  <TouchableOpacity
                    key={language.code}
                    onPress={() => {
                      setSelectedLanguage(language);
                      setLanguageModalVisible(false);
                    }}
                    className={`flex-row items-center justify-between p-4 rounded-xl ${
                      isSelected ? "bg-[#5F7A4B]" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-base ${
                        isSelected ? "text-white" : "text-[#1F2937]"
                      }`}
                    >
                      {language.label}
                    </Text>
                    <Text
                      className={`font-bold ${
                        isSelected ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      {language.short}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setLanguageModalVisible(false)}
              className="mt-4 py-2"
            >
              <Text className="text-gray-400 font-semibold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <BottomSheetModal
        ref={helpSheetRef}
        index={0}
        snapPoints={supportSheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backdropComponent={renderSheetBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 44 }}
        backgroundStyle={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        <View className="flex-1 bg-white px-6 pt-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Help Center
            </Text>
            <TouchableOpacity
              onPress={() => helpSheetRef.current?.dismiss()}
              className="bg-gray-100 px-4 py-2 rounded-xl"
            >
              <Text className="text-gray-700 font-semibold">Close</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 115 }}
          >
            <Text className="text-sm text-gray-500 mb-4">
              Need help using AI Gardener? Start with these quick answers.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              1. How do watering reminders work?
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Enable reminders when adding or editing a plant, then set a frequency and preferred time. AI Gardener will schedule a local notification on your device.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              2. Why am I not receiving notifications?
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Check that notifications are enabled in both your device settings and the Notifications switch in your Account page. If needed, re-enable them and open system settings from the prompt.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              3. How can I edit plant details?
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Open a plant from your list, tap Edit, then update name, species, location, photo, or reminder settings. Save changes to apply updates.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              4. Can I turn reminders off for one plant only?
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Yes. In the plant edit screen, disable reminders for that specific plant and save. Other plants can continue sending reminders.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              5. How do I delete a plant?
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              From your plant list or plant details screen, use the delete option. This removes the plant and its associated scheduled reminder.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              6. Contact Support
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              If your issue continues, please contact the AI Gardener support team from the app support channels or project maintainers.
            </Text>

            <TouchableOpacity
              onPress={handleContactUs}
              className="bg-[#5F7A4B] py-3.5 rounded-xl"
            >
              <Text className="text-white text-center font-bold text-lg">
                Contact Us
              </Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        ref={privacySheetRef}
        index={0}
        snapPoints={supportSheetSnapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backdropComponent={renderSheetBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 44 }}
        backgroundStyle={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        <View className="flex-1 bg-white px-6 pt-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Privacy Policy
            </Text>
            <TouchableOpacity
              onPress={() => privacySheetRef.current?.dismiss()}
              className="bg-gray-100 px-4 py-2 rounded-xl"
            >
              <Text className="text-gray-700 font-semibold">Close</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 115 }}
          >
            <Text className="text-xs text-gray-400 mb-4">
              Last updated: March 1, 2026
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              1. Overview
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              AI Gardener is designed to help you manage plants, schedules, and reminders. This policy explains what data we collect, how we use it, and how you can control it.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              2. Data We Collect
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              We may collect account data such as your name, email, and profile image. We also store plant related data you add, including plant name, species, location, reminder frequency, preferred time, and optional photos.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              3. How We Use Data
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Your data is used to provide core app features, sync your plant list, personalize your experience, and send watering reminders when notifications are enabled.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2"> 
              4. Notifications
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              If you allow notifications, the app schedules local reminders on your device based on your plant settings. You can disable notifications anytime in app settings or system settings.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              5. Photo and Camera Access
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Camera and photo library permissions are used only when you choose to add or update plant photos. We do not access these resources without your action.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              6. Data Sharing
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              We do not sell your personal data. Data is shared only with services required to operate the app, such as authentication, storage, and backend infrastructure.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              7. Data Retention and Deletion
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              We keep your data while your account is active. You can remove plant entries at any time. You may also request account deletion through support.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              8. Security
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              We use standard security practices to protect your information. No system is fully risk free, but we continuously improve safeguards.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              9. Your Rights
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Depending on your region, you may have rights to access, correct, export, or delete your personal data. Contact support to submit requests.
            </Text>

            <Text className="text-base font-bold text-gray-800 mb-2">
              10. Contact
            </Text>
            <Text className="text-gray-600 leading-6">
              For privacy questions, contact the AI Gardener support team through the Help Center section in this app.
            </Text>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    </View>
    </BottomSheetModalProvider>
  );
};

export default AccountScreen;
