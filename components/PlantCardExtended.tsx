import { useRouter } from "expo-router";
import { Edit3, Leaf, MoreVertical, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PlantListItemProps {
  id: string;
  specie: string;
  name: string;
  schedule: string;
  from?: "home" | "myPlants";
  remindersEnabled?: boolean;
  image: ImageSourcePropType;
  // Callback-uri pentru actiuni
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onWater?: () => void; // Am adaugat si optiunea de udare
}

export default function PlantListItem({
  name,
  schedule,
  from,
  remindersEnabled = true,
  image,
  id,
  specie,
  onPress,
  onEdit,
  onDelete,
  onWater,
}: PlantListItemProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const scheduleLabel = remindersEnabled ? schedule : "Reminders off";

  // --- HANDLERS ---
  const handleOptionsPress = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleEdit = () => {
    setModalVisible(false);
    if (onEdit) {
      onEdit();
    } else {
      // Fallback daca nu e pasat onEdit: navigam direct
      router.push({
        pathname: "/editPlant",
        params: { id: id },
      });
    }
  };

  const handleDelete = () => {
    setModalVisible(false); // close options modal first
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    setDeleteModalVisible(false);
    if (onDelete) onDelete();
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
  };

  const handleWater = () => {
    setModalVisible(false);
    if (onWater) onWater();
  };

  return (
    <>
      {/* --- CARDUL PRINCIPAL --- */}
      <TouchableOpacity
        key={id}
        className="bg-[#F7F6F2] rounded-3xl p-4 mb-4 flex-row items-center shadow-sm border border-[#E8E6DE]"
        activeOpacity={0.7}
        delayLongPress={300}
        onLongPress={handleOptionsPress}
        onPress={() =>
          router.push({
            pathname: "./plantDetails",
            params: { id: id, from: from },
          })
        }
      >
        {/* Imaginea */}
        <View className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-white shadow-sm bg-gray-200">
          <Image source={image} className="w-full h-full" resizeMode="cover" />
        </View>
        {/* Textul */}
        <View className="flex-1 justify-center">
          <Text className="text-[#1F2937] text-lg font-bold mb-0.5 leading-6">
            {name}
          </Text>
          <Text className="text-[#888888] text-xs font-medium text-lg text-gray-500 italic font-medium">
            {specie || "Unknown"}
          </Text>
          <Text
            className={`text-xs font-bold mt-1 ${remindersEnabled ? "text-[#5F7A4B]" : "text-gray-400"}`}
          >
            {scheduleLabel}
          </Text>
        </View>

        {/* Butonul de Optiuni (Trei puncte) */}
        <TouchableOpacity
          className="p-3 -mr-2 rounded-full active:bg-gray-200/50"
          activeOpacity={0.5}
          onPress={handleOptionsPress}
        >
          <MoreVertical size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* --- MODALUL DE OPTIUNI (STILIZAT) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={handleCloseModal}
          className="justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl"
          >
            {/* Header Icon */}
            <View className="w-16 h-16 bg-[#5F7A4B]/10 rounded-full items-center justify-center mb-4">
              <Leaf size={32} color="#5F7A4B" />
            </View>

            {/* Titlu Modal */}
            <Text className="text-xl font-bold text-[#1F2937] mb-1 text-center">
              {name}
            </Text>
            <Text className="text-gray-400 text-sm mb-6 font-medium tracking-wider">
              What would you like to do with this plant?
            </Text>

            {/* 2. Buton EDITARE (Gri) */}
            <TouchableOpacity
              onPress={handleEdit}
              className="w-full bg-[#F3F4F6] py-4 rounded-xl flex-row items-center justify-center mb-3 border border-gray-200"
            >
              <Edit3 size={20} color="#4B5563" className="mr-2" />
              <Text className="text-gray-700 font-bold text-lg ml-2">
                Edit Details
              </Text>
            </TouchableOpacity>

            {/* 3. Buton STERGERE (Rosu) */}
            <TouchableOpacity
              onPress={handleDelete}
              className="w-full bg-red-50 py-4 rounded-xl flex-row items-center justify-center mb-4 border border-red-100"
            >
              <Trash2 size={20} color="#EF4444" className="mr-2" />
              <Text className="text-[#EF4444] font-bold text-lg ml-1">
                Delete Plant
              </Text>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity onPress={handleCloseModal} className="py-2">
              <Text className="text-gray-400 font-medium text-base">Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* --- MODALUL DE CONFIRMARE DE STERGERE --- */}
      <Modal
        animationType="fade"
        transparent
        visible={deleteModalVisible}
        onRequestClose={handleCancelDelete}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={handleCancelDelete}
          className="justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl"
          >
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Trash2 size={30} color="#EF4444" />
            </View>

            <Text className="text-xl font-bold text-[#1F2937] mb-2 text-center">
              Delete Plant?
            </Text>
            <Text className="text-gray-500 text-center mb-6 leading-6">
              Are you sure you want to remove {name} from your garden? This cannot be undone.
            </Text>

            <TouchableOpacity
              onPress={handleConfirmDelete}
              className="w-full bg-red-500 py-3.5 rounded-xl items-center mb-3"
            >
              <Text className="text-white font-bold text-lg">Yes, Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancelDelete}
              className="w-full bg-gray-100 py-3.5 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
