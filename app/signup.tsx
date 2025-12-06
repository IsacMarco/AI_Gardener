import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function SignUpScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();
    const handleSignUp = () => {
        // Aici logică de creare cont (API)
        
        // După succes, mergi la Home
        (navigation as any).reset({
        index: 0,
        routes: [{ name: '(tabs)' }],
        });
    };

    const handleGoToLogin = () => {
        // Mergem înapoi la ecranul de Login
        if (router.canGoBack()) {
        router.back();
        } else {
        router.replace('/');
        }
    };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#5F7A4B', '#8C8673', '#AFA696']}
        locations={[0, 0.6, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
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
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
            
            <View className="items-center my-8">
                <Image
                    source={require('../assets/images/logo.png')}
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
                  style={{ width: '48%' }}
                  onPress={handleGoToLogin}
                >
                  <Text className="text-white font-bold text-base">Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="bg-white h-12 rounded-xl justify-center items-center"
                  style={{ width: '48%' }}
                  onPress={handleSignUp}
                >
                  <Text className="text-gray-600 font-bold text-base">Sign Up</Text>
                </TouchableOpacity>
              </View>

              <View className="items-center mt-2">
                <Text className="text-gray-500 mb-4 text-sm">or sign up with</Text>
                
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
  );
}