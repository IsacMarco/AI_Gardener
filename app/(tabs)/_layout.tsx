import { Tabs } from 'expo-router'
import React from 'react'
import { Image, ImageSourcePropType, Text, View } from 'react-native'

type TabIconProps = {
    focused: boolean
    icon: ImageSourcePropType
    title?: string
}

const TabIcon = ({ focused, icon, title }: TabIconProps) => {
    return (
        <View className="items-center">
           <Image
                source={icon}
                className={focused? "w-10 h-10 mx-auto": "w-12 h-12 mx-auto"}
                // keep tintColor dynamic via style because nativewind may not cover all tint cases
                style={{ tintColor: focused ? '#45a80bff' : '#9CA3AF' }}
            />
            {focused? <Text className='text-green-700 font-semibold text-sm w-full'>{title}</Text> : null}
        </View>
    )
}

const _layout = () => {
  return (
    <Tabs
       screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: { 
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 15,
            },
            tabBarStyle: { 
                position: 'absolute', // optional, dacă vrei să fie peste conținut
                borderTopWidth: 0, // elimină linia de sus
                elevation: 0, // elimină umbra pe Android
                height: 75,
            }
        }} 
    >
                <Tabs.Screen
                    name="index"
                    options={{
                        headerShown: false,
                        title: 'Home',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} icon={require('../../assets/icons/home_icon.png')} title="Home" />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="aiHelper"
                    options={{
                        headerShown: false,
                        title: 'AI Gardener',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} icon={require('../../assets/icons/ai_icon.png')} title="AI Gardener" />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="myPlants"
                    options={{
                        headerShown: false,
                        title: 'My Plants',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} icon={require('../../assets/icons/plants_icon.png')} title="Plants" />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="account"
                    options={{
                        headerShown: false,
                        title: 'Account',
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} icon={require('../../assets/icons/account_icon.png')} title="Account" />
                        ),
                    }}
                />
    </Tabs>
  )
}

export default _layout