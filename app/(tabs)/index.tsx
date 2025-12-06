import PlantCard from '@/components/PlantCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // Importăm useRouter
import { Camera, Mic, Search, Sprout, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const plants = [
  { 
    id: 1, 
    name: 'Monstera', 
    subtitle: 'Deliciosa', 
    schedule: 'Oct 25, 7 PM',
    image: require('../../assets/icons/plants_icon.png') 
  },
  { 
    id: 2, 
    name: 'Sansevieria', 
    subtitle: 'Trifasciata', 
    schedule: 'Oct 24, 9 AM',
    image: require('../../assets/icons/plants_icon.png') 
  },
  { 
    id: 3, 
    name: 'Ficus Lyrata', 
    subtitle: 'Oct 23, 7 PM',
    schedule: 'Oct 23, 7 PM',
    image: require('../../assets/icons/plants_icon.png') 
  },
];

export default function HomeScreen() {
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
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="items-center mt-4 mb-8">
                <Text className="text-3xl font-bold text-white mb-6 tracking-wide shadow-sm">
                    Welcome Home!
                </Text>
                <TouchableOpacity className="w-40 h-40 bg-[#A4B58E] rounded-full items-center justify-center border-4 border-white/30 shadow-lg"
                onPress={() => router.push('/account')}
                >
                    <User size={80} color="white" fill="#a0c472ff" />
                </TouchableOpacity>
            </View>
            <View className="flex-1 bg-white/55 rounded-t-[35px] px-6 pt-8 pb-10 min-h-full">

                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-[#1F2937] mb-5 pl-1">
                    Your Garden at a Glance
                  </Text>
                  <Text className="text-md text-gray-600 mb-5 pl-1"
                  style={{ alignSelf: 'flex-end' }}
                  onPress={() => router.push('/myPlants')}
                  >
                      see all
                  </Text>
                </View>
                <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            marginBottom: 4
                        }}
                    >
                        {plants.map((plant) => (
                            <PlantCard
                                key={plant.id}
                                id={plant.id}
                                name={plant.name}
                                specie={plant.subtitle}
                                image={plant.image}
                                schedule={plant.schedule}
                            />
                        ))}
                    </ScrollView>
                </View>

                <Text className="text-xl font-bold text-[#1F2937] mb-4 pl-1 pt-2">
                    Talk to AI Gardener
                </Text>
                <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => router.push('/aiHelper')}
                    className="bg-white/90 flex-row items-center px-4 py-3.5 rounded-2xl shadow-sm mb-8"
                >
                    <Search size={20} color="#9CA3AF" />
                    <Text className="flex-1 ml-3 text-base text-[#9CA3AF]">
                        Ask me anything...
                    </Text>
                    <View className="flex-row gap-4">
                        <View>
                            <Camera size={22} color="#5F7A4B" />
                        </View>
                        <View>
                            <Mic size={22} color="#5F7A4B" />
                        </View>
                    </View>
                </TouchableOpacity>

                <View className="mb-20">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-4">
                            <Text className="text-xl font-bold text-[#1F2937] mb-2">
                                Daily Plant Care Tip
                            </Text>
                            <Text className="text-gray-600 text-sm leading-5">
                                Rotate your houseplants weekly for even growth and prevent leaning towards the light source.
                            </Text>
                        </View>
                        <View className="mt-1">
                             <Sprout size={32} color="#5F7A4B" />
                        </View>
                    </View>
                </View>

            </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}