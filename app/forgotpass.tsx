import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleReset = () => {
    // Validare simplă: verificăm dacă câmpul nu e gol
    if (!email.trim()) {
      Alert.alert("Atenție", "Te rugăm să introduci o adresă de email.");
      return;
    }

    // 2. Afișăm alerta de confirmare
    Alert.alert(
      "Email Confirmation", // Titlul
      `Are you sure this is the correct email address?\n\n${email}`, // Mesajul
      [
        {
          text: "Cancel",
          style: "cancel", // Butonul de anulare
        },
        {
          text: "Yes, Send",
          onPress: () => {
            // Aici se execută logica doar dacă utilizatorul apasă "Da"
            console.log("Reset link sent to:", email);
            
            // Poți afișa un mesaj de succes sau te poți întoarce
            Alert.alert("Success", "The reset link has been sent!", [
              { text: "OK", onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
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
        <View className="px-5 mt-2">
            <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
                <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-between"
        >
          
          <View className="items-center" style={{ marginTop: height * 0.05 }}>
            <View className="mb-4 items-center justify-center relative">
               <MaterialCommunityIcons name="brain" size={50} color="white" />
               <MaterialCommunityIcons name="sprout" size={40} color="white" style={{ position: 'absolute', bottom: -5 }} />
            </View>
            
            <Text className="text-2xl font-bold text-white tracking-widest mb-1">
              AI GARDENER
            </Text>
          </View>

          <View 
            className="bg-white/25 rounded-t-[30px] px-8 pt-10 pb-10 justify-start"
            style={{ height: height * 0.55 }}
          >
            <Text className="text-3xl font-bold text-white mb-3">
              Forgot Password?
            </Text>
            <Text className="text-gray-100 text-base mb-8 leading-5">
              Don't worry! It happens. Please enter the email address associated with your account.
            </Text>

            <View className="mb-8">
              <TextInput
                className="bg-white rounded-xl h-12 px-4 text-base text-gray-800"
                placeholder="Email Address"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
                className="bg-white h-12 rounded-xl justify-center items-center mb-6"
                onPress={handleReset}
            >
                <Text className="text-gray-600 font-bold text-base">Send Reset Link</Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}