import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const aiHelper = () => {
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
          AI Gardener
        </Text>
        <View className="mt-5 mx-5">
          <Text className="text-lg text-center">
            Welcome to the AI Gardener! Here, you can access a variety of AI-powered tools and resources to help you with your gardening needs. Whether you're looking for plant care advice, garden design ideas, or pest management tips, our AI assistant is here to help you cultivate a thriving garden.
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default aiHelper