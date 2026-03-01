import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronRight, MessageCircleMore, ScanSearch } from "lucide-react-native";
import React from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AiHelperScreen() {
  const router = useRouter();

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#5F7A4B", "#8C8673", "#AFA696"]}
        locations={[0, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1 mt-4">
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-white tracking-wide">
            AI Assistant
          </Text>
          <Text className="text-white/85 mt-2 text-base text-center">
            Choose how you want AI Gardener to help you today.
          </Text>
        </View>

        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-5 pt-8">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("../aiPart/aiChat")}
            className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-[#D8D5CB]"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-12 h-12 rounded-full bg-[#5F7A4B]/15 items-center justify-center mr-4">
                  <MessageCircleMore size={24} color="#5F7A4B" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#1F2937] text-lg font-bold">
                    AI Chat Helper
                  </Text>
                  <Text className="text-[#6B7280] mt-1">
                    Ask questions about plant care, issues, and daily tips.
                  </Text>
                </View>
              </View>
              <ChevronRight size={22} color="#5F7A4B" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("../aiPart/aiIdentifier")}
            className="bg-white rounded-2xl p-5 shadow-sm border border-[#D8D5CB]"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-12 h-12 rounded-full bg-[#5F7A4B]/15 items-center justify-center mr-4">
                  <ScanSearch size={24} color="#5F7A4B" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#1F2937] text-lg font-bold">
                    Plant Identifier AI
                  </Text>
                  <Text className="text-[#6B7280] mt-1">
                    Identify plants from photos and get quick health insights.
                  </Text>
                </View>
              </View>
              <ChevronRight size={22} color="#5F7A4B" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
