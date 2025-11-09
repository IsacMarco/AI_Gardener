import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const myPlants = () => {
  return (
    <SafeAreaView>
      <Text className="text-3xl font-bold text-center mt-10">
        My Plants
      </Text>
      <View className="mt-5 mx-5">
        <Text className="text-lg text-center">
          Here you can manage and monitor all your plants. Add new plants,
          track their growth, and receive personalized care tips to ensure they
          thrive in your garden.
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default myPlants