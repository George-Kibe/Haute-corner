import { router, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { HRight, MyCart, TrackOrder } from '@/components/HeaderRight';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        "tabBarActiveTintColor": "#ffa500",
        "tabBarInactiveTintColor": "#000",
        "tabBarShowLabel": true,
        "tabBarStyle": [
        {
          "display": "flex"
        },
        ],
        tabBarButton: HapticTab,
        headerTitleAlign: 'left',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HauteCorner',
          tabBarIcon: ({ color }) => <Entypo name="home" color={color} size={24} />,
          headerRight: HRight, 
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <Ionicons name="list-circle" color={color} size={24} />,
          headerRight: TrackOrder,
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          title: 'Add Product',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-sharp" color={color} size={24} />,
          headerRight: MyCart,
        }}
      />
      <Tabs.Screen
        name="saved-items"
        options={{
          title: 'Wish List',
          tabBarIcon: ({ color }) => <Ionicons name="star" size={24} color={color} />,
          headerRight: MyCart,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Entypo name="user" color={color} size={24} />,
          headerRight: MyCart,
        }}
      />
    </Tabs>
  );
}
