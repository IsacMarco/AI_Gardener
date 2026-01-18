import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const PlantCard = ({ id, name, specie, image, schedule }) => {
  const isUserPhoto = image && image.uri;
  const router = useRouter();
  return (
    <TouchableOpacity
      key={id}
      activeOpacity={0.7}
      className="bg-[#F7F6F2] rounded-3xl p-4 overflow-hidden shadow-sm"
      style={{ width: 150, height: 185, marginRight: 12 }}
      onPress={() =>
        router.push({
          pathname: "/plantDetails",
          params: { id: id },
        })
      }
    >
      <View className="items-center justify-center flex-1">
        {/* Containerul rotund pentru poza */}
        <View className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 items-center justify-center bg-white">
          {image ? (
            <Image
              source={image}
              style={
                isUserPhoto
                  ? { width: "100%", height: "100%" }
                  : { width: 60, height: 60, tintColor: "#4B5563" }
              }
              resizeMode={isUserPhoto ? "cover" : "contain"}
            />
          ) : (
            <Image
              source={require("../assets/icons/plants_icon.png")}
              style={{ width: 60, height: 60, tintColor: "#4B5563" }}
              resizeMode="contain"
            />
          )}
        </View>

        <Text
          className="text-[#1F2937] text-base font-bold mt-4"
          numberOfLines={1}
        >
          {name}
        </Text>

        <Text className="text-gray-500 text-sm font-medium" numberOfLines={1}>
          {specie}
        </Text>

        <Text
          className="text-gray-500 text-xs mt-2 text-center"
          numberOfLines={2}
        >
          {schedule}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default PlantCard;
