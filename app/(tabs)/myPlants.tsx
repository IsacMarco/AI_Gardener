import PlantCardExtended from '@/components/PlantCardExtended';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Brain, Plus } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const myGardenData = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    schedule: 'Next Watering: Today, 7 PM',
    image: require('../../assets/icons/plants_icon.png'),
    specie: 'Monstera'
  },
  {
    id: '2',
    name: 'Snake',
    schedule: 'Next Watering: Tomorrow, 9 AM',
    image: require('../../assets/icons/plants_icon.png'),
    specie: 'Sansevieria'
  },
  {
    id: '3',
    name: 'Snake',
    schedule: 'Next Watering: Oct 26, 1 PM',
    image: require('../../assets/icons/plants_icon.png'),
    specie: 'Sansevieria'
  },
  {
    id: '4',
    name: 'Fiddle Leaf Fig',
    schedule: 'Next Watering: Oct 26, 5 PM',
    image: require('../../assets/icons/plants_icon.png'),
    specie: 'Ficus Lyrata'
  },
];
export default function MyPlants() {
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
        </View>
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-white tracking-wider">
            My Garden
          </Text>
        </View>
        <View className="flex-1 bg-[#E8E6DE]/95 rounded-t-[35px] px-5 pt-8 pb-4">          
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 100}}
          >
            {myGardenData.map((plant) => (
              <PlantCardExtended
                key={plant.id}
                id={plant.id}
                name={plant.name}
                schedule={plant.schedule}
                image={plant.image}
                specie={plant.specie}
              />
            ))}
          </ScrollView>
          <View className="absolute bottom-5 left-5 right-5 flex-row items-center justify-between">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push('/aiHelper')}
              className="flex-1 bg-[#EBE9DE] flex-row items-center py-4 px-5 rounded-full mr-4 shadow-sm border border-white/50"
            >
              <View className="mr-3">
                <Brain size={24} color="#5F7A4B" />
              </View>
              <Text className="text-[#1F2937] font-bold text-base">
                Talk to AI Gardener
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.8}
              className="w-14 h-14 bg-[#769055] rounded-full items-center justify-center shadow-lg"
              onPress={() => router.push("/addPlant")}
            >
              <Plus size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}