// import { Tabs } from 'expo-router'
// import React from 'react'
// import { Image, ImageSourcePropType, View } from 'react-native'

// type TabIconProps = {
//     focused: boolean
//     icon: ImageSourcePropType
// }

// const TabIcon = ({ focused, icon}: TabIconProps) => {
//     return (
//         // centrat pe orizontala si vertical in zona butonului
//         <View className="flex-row items-center justify-center">
//             <Image
//                 source={icon}
//                 className='w-12 h-12'
//                 style={{ tintColor: focused ? '#16a34a' : '#9CA3AF' }}
//             />
//         </View>
//     );
// }

// const _layout = () => {
//     return (
//         <Tabs
//             screenOptions={{
//                 headerShown: false,
//                 tabBarShowLabel: false,
//                 tabBarItemStyle: {
//                     // fiecare buton ocupa spatiul ramas si-si centerizeaza continutul
//                     flex: 1,
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     paddingTop: 12,
//                 },
//                 tabBarStyle: {
//                     position: 'absolute',
//                     left: 20,
//                     right: 20,
//                     bottom: 15,
//                     height: 65,
//                     borderRadius: 40,
//                     borderTopWidth: 0,
//                     backgroundColor: '#ffffff',
//                     shadowColor: '#000',
//                     shadowOpacity: 0.08,
//                     shadowRadius: 10,
//                     alignItems: 'center',
//                     overflow: 'hidden',
//                     paddingHorizontal: 12,
//                     marginHorizontal: 15
//                 }
//             }}
//         >
//             <Tabs.Screen
//                 name="index"
//                 options={{
//                     tabBarIcon: ({ focused }) => (
//                         <TabIcon focused={focused} icon={require('../../assets/icons/home_icon.png')}/>
//                     ),
//                 }}
//             />
//             <Tabs.Screen
//                 name="aiHelper"
//                 options={{
//                     title: 'AI Gardener',
//                     tabBarIcon: ({ focused }) => (
//                         <TabIcon focused={focused} icon={require('../../assets/icons/ai_icon.png')}/>
//                     ),
//                 }}
//             />
//             <Tabs.Screen
//                 name="myPlants"
//                 options={{
//                     tabBarIcon: ({ focused }) => (
//                         <TabIcon focused={focused} icon={require('../../assets/icons/plants_icon.png')}/>
//                     ),
//                 }}
//             />
//             <Tabs.Screen
//                 name="account"
//                 options={{
//                     tabBarIcon: ({ focused }) => (
//                         <TabIcon focused={focused} icon={require('../../assets/icons/account_icon.png')}/>
//                     ),
//                 }}
//             />
//         </Tabs>
//     )
// }

// export default _layout
import { Stack } from "expo-router";
import React from "react";
import { PlantProvider } from "../../context/PlantContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabsLayout() {
  return (
    <PlantProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="account" />
          <Stack.Screen name="myPlants" />
          <Stack.Screen name="aiHelper" />
          <Stack.Screen name="addPlant" />
          <Stack.Screen name="plantDetails" />
          <Stack.Screen name="editPlant" />
          <Stack.Screen name="marketplace" />
        </Stack>
      </SafeAreaProvider>
    </PlantProvider>
  );
}
