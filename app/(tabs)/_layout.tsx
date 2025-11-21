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
        // centrat pe orizontală și vertical în zona butonului
        <View className="flex-row items-center justify-center">
            <Image
                source={icon}
                className='w-12 h-12'
                style={{ tintColor: focused ? '#16a34a' : '#9CA3AF' }}
            />
        </View>
    );
}

const _layout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    // fiecare buton ocupă spațiul rămas și-și centerizează conținutul
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: 12,
                },
                tabBarStyle: {
                    position: 'absolute',
                    left: 20,
                    right: 20,
                    bottom: 15,
                    height: 65,
                    borderRadius: 40,
                    borderTopWidth: 0,
                    backgroundColor: '#ffffff',
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    alignItems: 'center',
                    overflow: 'hidden',
                    paddingHorizontal: 12,
                    marginHorizontal: 15
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