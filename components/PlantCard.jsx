import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
const PlantCard = ({ id, name, specie, image, schedule }) => {
    return (
        <TouchableOpacity 
            key={id}
            className="bg-[#F7F6F2] rounded-3xl p-4 mb-4 flex-row items-center overflow-hidden shadow-sm"
            activeOpacity={0.7}
            style={{ width: 140, marginRight: 12, height: 180, flexDirection: 'column', justifyContent: 'center' }}
            >
            <View className="items-center flex-1">
                <View className="rounded-full overflow-hidden border border-gray-200 items-center"
                    style={{ alignSelf: 'center', justifyContent: 'center' }}
                >
                    <Image
                        source={image}
                        resizeMode="contain"
                        style={{ width: 70, height: 70, tintColor: '#4B5563'}}
                    />
                </View>
                <Text className="text-black text-md font-bold mt-4">
                    {name}
                </Text>
                <Text className="text-gray-400 text-md font-medium">
                    {specie}
                </Text>
                <Text className="text-gray-400 text-sm mt-2">
                    {schedule}
                </Text>
            </View>
        </TouchableOpacity>
    )
}
export default PlantCard