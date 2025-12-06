import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const account = () => {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const handleNotificationsToggle = () => {
    setNotificationsEnabled(previousState => !previousState);
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
          <Text className="text-4xl font-bold text-white"
            style={{ alignSelf: 'center' }}
          >
            Account
          </Text>
          <View className="w-40 h-40 bg-[#A4B58E] rounded-full items-center justify-center border-4 border-white/30 shadow-lg" style={{ alignSelf: 'center', marginTop: 15, marginBottom: 20 }}>
              <User size={90} color="white" fill="#a0c472ff" />
          </View>
          <TouchableOpacity className="justify-center items-center" 
          style={{
            flexDirection: 'row',
            alignSelf: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            width: 130
          }}>
              <Image source={require('../../assets/icons/editprofile.png')} style={{ width: 24, height: 24, marginRight: 8, tintColor: '#FFF' }} />
              <Text style={{
                color: '#FFF',
                fontWeight: '600',
                fontSize: 13,
              }}>Edit Profile</Text>
            </TouchableOpacity>
        </View>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          style={{ marginTop: 20 }}
        >
          <View style={{ flexGrow: 1, justifyContent: 'space-between' }}>
            <View 
              className="bg-white/50 rounded-t-[30px] px-5 pt-8 pb-5 justify-start"
              style={{ minHeight: height * 0.85 }}
            >
              <Text className="text-3xl font-bold text-white mb-6">
                Settings
              </Text>
              <View className="bg-white/40 px-4 mx-2 rounded-lg">
                <View className="flex-row items-center justify-start border-b py-2 border-gray-300">
                  <Image source={require('../../assets/icons/notifications.png')} style={{ width: 38, height: 34, marginRight: 2 }} />
                  <Text className="text-xl text-black ml-3">Notifications</Text>
                  <Switch
                    trackColor={{ false: '#6fa57677', true: '#5e7c46ff' }}
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#D1D1D6"
                    onValueChange={handleNotificationsToggle}
                    value={notificationsEnabled}
                    className='justify-between ml-auto'
                  />
                </View>
                <TouchableOpacity className="flex-row items-center justify-start border-b py-4 border-gray-300">
                  <Image source={require('../../assets/icons/language.png')} style={{ width: 38, height: 34, marginRight: 2 }} />
                  <Text className="text-xl text-black ml-3">Language</Text>
                  <Text className="text-md text-gray-500 ml-auto">English</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-start border-b py-4 ml-1 border-gray-300">
                  <Image source={require('../../assets/icons/textsize.png')} style={{ width: 38, height: 26 }} />
                  <Text className="text-xl text-black ml-3">Text Size</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="flex-row items-center justify-center py-2 rounded-lg"
                style={{ 
                  marginTop: 40,
                  backgroundColor: 'rgba(255, 0, 0, 1)',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 0, 0, 0.2)', 
                  width: '60%',
                  alignSelf: 'center'
                }}
                onPress={() => {
                  Alert.alert(
                    'Log out',
                    'Are you sure you want to log out?',
                    [
                      { text: 'Stay Logged In' },
                      { text: 'Log Out', style: 'destructive', onPress: () => console.log('Logged out') },
                    ],
                    { cancelable: true }
                  );
                }}
              >
                  <Image source={require('../../assets/icons/logout.png')} style={{ width: 30, height: 30 }} />
                  <Text className="text-xl text-black ml-3">Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default account;