import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();
    const handleLogin = () => {
        //logica de validare
        // if (email.trim() === '' || password.trim() === '') {
        //     alert('Please enter both email and password.');
        //     return;
        // }
        // if (!/\S+@\S+\.\S+/.test(email)) {
        //     alert('Please enter a valid email address.');
        //     return;
        // }
        // Navighează către Tab-uri și înlocuiește istoricul
        // astfel încât userul să nu poată da "Back" la login.
        (navigation as any).reset({
            index: 0,
            routes: [{ name: '(tabs)' }],
            });
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-between"
        >
          
          <View className="items-center" style={{ marginTop: height * 0.08 }}>
            <Image
              source={require('../assets/images/logo.png')}
              className="w-41 h-40"
              resizeMode="contain"
            />
          </View>

          <View 
            className="bg-white/55 rounded-t-[30px] px-8 pt-10 pb-10 justify-start"
            style={{ height: height * 0.6 }}
          >
            <Text className="text-3xl font-bold text-white mb-8">
              Welcome Back!
            </Text>

            <View className="mb-5">
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

            <View className="flex-row justify-between mb-4">
              <TouchableOpacity 
                className="bg-white h-12 rounded-xl justify-center items-center"
                style={{ width: '48%' }}
                onPress={handleLogin}
              >
                <Text className="text-gray-600 font-bold text-base">Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-transparent border border-white h-12 rounded-xl justify-center items-center"
                style={{ width: '48%' }}
                onPress={() => router.push('/signup')}
              >
                <Text className="text-white font-bold text-base">Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ 
                alignSelf: 'flex-start', 
                width: '31%',
            }} 
            onPress={() => router.push('/forgotpass')}>
              <Text className="text-gray-500 text-sm mb-10">Forgot Password?</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-gray-500 mb-5 text-sm">or continue with</Text>
              
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}