import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const PlantCard = ({ id, name, specie, image, schedule }) => {
  return (
    <TouchableOpacity
      key={id}
      activeOpacity={0.7}
      className="bg-[#F7F6F2] rounded-3xl p-4 overflow-hidden shadow-sm"
      style={{ width: 150, height: 185, marginRight: 12 }}
    >
      <View className="items-center justify-center flex-1">
        <View className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 items-center justify-center bg-white">
          <Image
            source={image}
            resizeMode="contain"
            style={{ width: 60, height: 60, tintColor: "#4B5563" }}
          />
        </View>

        <Text className="text-[#1F2937] text-base font-bold mt-4" numberOfLines={1}>
          {name}
        </Text>

        <Text className="text-gray-500 text-sm font-medium" numberOfLines={1}>
          {specie}
        </Text>

        <Text className="text-gray-500 text-xs mt-2 text-center" numberOfLines={2}>
          {schedule}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default PlantCard;