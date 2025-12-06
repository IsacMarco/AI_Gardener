import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, Mic, Search } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AiHelperScreen() {
  const router = useRouter();

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#5F7A4B', '#8C8673', '#AFA696']}
        locations={[0, 0.6, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-2 mb-2">
          <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
              <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-white tracking-wide">
            Talk to AI Gardener
          </Text>
          
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-[#D4E7C5] p-4 rounded-2xl rounded-tl-none self-start mb-6 shadow-sm" style={{ maxWidth: '85%' }}>
              <Text className="text-[#1F2937] text-base leading-6">
                Hello! How can I help your plants today? Please describe symptoms or upload is photo of the plant.
              </Text>
            </View>

            <View className="self-end mb-6" style={{ maxWidth: '75%' }}>
              <View className="bg-[#F3F4F6] p-3 rounded-2xl rounded-tr-none shadow-sm">
                <View className="bg-white rounded-xl overflow-hidden mb-3">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=2664&auto=format&fit=crop' }} 
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                </View>
                <Text className="text-[#1F2937] text-base leading-5">
                  My Monstera leaves look lie this. What's wrong?
                </Text>
              </View>
            </View>

            <View className="self-end mb-6" style={{ maxWidth: '75%' }}>
              <View className="bg-[#F3F4F6] p-3 rounded-2xl rounded-tr-none shadow-sm">
                <View className="bg-white rounded-xl overflow-hidden mb-3">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=2664&auto=format&fit=crop' }} 
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                </View>
                <Text className="text-[#1F2937] text-base leading-5">
                  My Monstera leaves look lie this. What's wrong?
                </Text>
              </View>
            </View>

            <View className="self-end mb-6" style={{ maxWidth: '75%' }}>
              <View className="bg-[#F3F4F6] p-3 rounded-2xl rounded-tr-none shadow-sm">
                <View className="bg-white rounded-xl overflow-hidden mb-3">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=2664&auto=format&fit=crop' }} 
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                </View>
                <Text className="text-[#1F2937] text-base leading-5">
                  My Monstera leaves look lie this. What's wrong?
                </Text>
              </View>
            </View>
            <View className="bg-[#D4E7C5] p-4 rounded-2xl rounded-tl-none self-start mb-4 shadow-sm" style={{ maxWidth: '85%' }}>
              <Text className="text-[#1F2937] text-base leading-6 mb-3">
                Based on the photo, your Monstera lickely has fungal infection. Reduce watring and apply a funclicide.
              </Text>
              
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-[#1F2937] font-bold text-base mr-1">
                  Tap for more details
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
          
          <View className="px-4 pt-2">
            <View className="flex-row items-center gap-3">
              <View
                    className="bg-white flex-row items-center px-4 py-3.5 rounded-2xl shadow-sm mb-8"
                >
                    <Search size={20} color="#9CA3AF" />
                    <TextInput className="flex-1 ml-3 text-base text-[#9CA3AF]"
                    placeholder="Ask me anything..."
                  placeholderTextColor="#A0A0A0"
                    >
                    </TextInput>
                    <View className="flex-row gap-4">
                        <View>
                            <Camera size={22} color="#5F7A4B" />
                        </View>
                        <View>
                            <Mic size={22} color="#5F7A4B" />
                        </View>
                    </View>
                </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}