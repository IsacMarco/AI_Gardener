import { MoreVertical, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, ImageSourcePropType, Modal, Text, TouchableOpacity, View } from 'react-native';

interface PlantListItemProps {
  id: string;
  specie: string;
  name: string;
  schedule: string;
  image: ImageSourcePropType; // Poate fi require('...') sau { uri: '...' }
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const { width } = Dimensions.get('window');

export default function PlantListItem({ name, schedule, image, id, specie, onPress, onEdit, onDelete }: PlantListItemProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOptionsPress = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
          key={id}
          className="bg-[#F7F6F2] rounded-3xl p-4 mb-4 flex-row items-center shadow-sm"
          activeOpacity={0.7}
      >
          <View className="w-16 h-16 rounded-full overflow-hidden mr-4 border border-gray-200">
          <Image 
              source={image} 
              className="w-full h-full"
              resizeMode="cover"
          />
          </View>

          <View className="flex-1">
          <Text className="text-[#1F2937] text-lg font-bold mb-1">
              {name}
              </Text>
          <Text className="text-[#888888] text-sm font-medium">
              {schedule}
          </Text>
          </View>

          <TouchableOpacity
              className="p-2 -mr-2"
              activeOpacity={0.5}
              onPress={handleOptionsPress}
          >
              <MoreVertical size={22} color="#5F7A4B" />
          </TouchableOpacity>
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          {/* Oprim propagarea touch-ului pentru a nu închide modalul când apăsăm pe el */}
          <TouchableOpacity 
            activeOpacity={1} 
            style={{ width: '85%', borderRadius: 32, backgroundColor: 'white', padding: 24 }}
            className="bg-white rounded-[32px] p-6 shadow-2xl items-center"
          >
            <TouchableOpacity 
              onPress={handleCloseModal} 
              style={{ position: 'absolute', width: '100%', alignItems: 'flex-end', paddingTop: 8}}
            >
              <X size={25} color="#9CA3AF" />
            </TouchableOpacity>
            <View className="mb-6 mt-4 items-center">
              <Text className="text-xl font-bold text-[#1F2937] mb-2">
                Manage Plant
              </Text>
            </View>
            <TouchableOpacity
              className="w-full bg-red-100 py-4 rounded-full items-center mb-4 shadow-sm border border-white/50"
            >
              <Text className="text-[#1F2937] font-bold text-base">
                Edit Plant
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full bg-red-100 py-4 rounded-full items-center shadow-sm border border-white/50"
            >
              <Text className="text-[#D14343] font-bold text-base">
                Delete Plant
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>  
        </TouchableOpacity>
      </Modal>
    </>
  );
}