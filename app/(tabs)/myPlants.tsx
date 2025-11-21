import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const myPlants = () => {
  return (
    <SafeAreaView>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: "100 %", paddingBottom: 65
        }}
        style={{
          backgroundColor: "#DDF6D2",
          paddingTop: 10
        }}
      >
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
      </ScrollView>
    </SafeAreaView>
  )
}

export default myPlants