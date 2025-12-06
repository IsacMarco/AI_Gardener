import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, Leaf, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddPlant() {
  const router = useRouter();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [plantName, setPlantName] = useState('');

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
            colors={['#5F7A4B', '#8C8673', '#AFA696']}
            locations={[0, 0.6, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        /> 

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
                <TouchableOpacity className="flex-row items-center gap-4">
                  <View className="w-24 h-24 bg-[#E8F5E9]/80 rounded-full items-center justify-center border-4 border-white/30 shadow-sm">
                    <View className="items-center">
                        <Camera size={35} color="#5F7A4B" />
                    </View>
                  </View>
                  <Text className="text-white/90 text-lg font-medium">
                    Tap to add photo
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-[#E8E6DE]/95 flex-1 rounded-t-[35px] px-6 pt-8 pb-10 min-h-[600px]">
                <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
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

                <Text className="text-[#1F2937] font-bold text-lg mb-3 ml-1">
                  Watering Schedule
                </Text>
  
                <View className="bg-white rounded-3xl p-5 shadow-sm mb-8">
                  
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-500 text-base font-medium">
                      Set Reminders
                    </Text>
                    <Switch
                    trackColor={{ false: '#6fa57677', true: '#5e7c46ff' }}
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#D1D1D6"
                    onValueChange={setRemindersEnabled}
                    value={remindersEnabled}
                    className='justify-between ml-auto'
                  />
                  </View>

                  {remindersEnabled && (
                    <View className="flex-row gap-3 mb-6">
                      <TouchableOpacity className="flex-1 bg-[#F9F9F9] border border-gray-100 rounded-xl px-4 py-3">
                        <Text className="text-[#1F2937] font-medium">Every 3 Days</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-1 bg-[#F9F9F9] border border-gray-100 rounded-xl px-4 py-3 items-end">
                        <Text className="text-[#1F2937] font-medium">Today, 8 PM</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View className="h-[1px] bg-gray-100 w-full mb-4" />
                  <TouchableOpacity className="flex-row items-center justify-between mb-4 py-1">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 bg-[#E8F5E9] rounded-full items-center justify-center">
                        <Leaf size={16} color="#5F7A4B" fill="#5F7A4B" />
                      </View>
                      <Text className="text-[#1F2937] font-bold text-base">Fertilizing</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  <View className="h-[1px] bg-gray-100 w-full mb-4" />
                  <TouchableOpacity className="flex-row items-center justify-between py-1">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 bg-[#FFF8E1] rounded-full items-center justify-center">
                        <Sun size={18} color="#FBC02D" fill="#FBC02D" />
                      </View>
                      <Text className="text-[#1F2937] font-bold text-base">Light Requirements</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </TouchableOpacity>

                </View>
                <TouchableOpacity 
                  className="bg-[#6B8E4E] py-4 rounded-2xl items-center shadow-md active:bg-[#5a7841] mt-auto mb-6"
                  activeOpacity={0.8}
                  onPress={() => router.back()} // Sau logica de salvare
                >
                  <Text className="text-white font-bold text-lg">Save Plant</Text>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
}