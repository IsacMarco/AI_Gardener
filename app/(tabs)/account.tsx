
import React from 'react'
import { ScrollView, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const account = () => {
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
        <Text>Account Screen</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

export default account