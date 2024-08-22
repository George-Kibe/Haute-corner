import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Entypo from "react-native-vector-icons/Entypo"
import Ionicons from "react-native-vector-icons/Ionicons"
import HomeStack from './HomeStack'
import AddProductScreen from '../screens/AddProductScreen'

import {NavigationContainer} from '@react-navigation/native';
import SavedItemsScreen from '../screens/SavedItemsScreen'
import ProfileScreen from '../screens/ProfileScreen'

const BottomTab = createBottomTabNavigator()

const BottomTabsNavigator = () => {
  return (
    <NavigationContainer>
    <BottomTab.Navigator
        screenOptions={{
            "tabBarActiveTintColor": "#ffa500",
            "tabBarInactiveTintColor": "#000",
            "tabBarShowLabel": true,
            "tabBarStyle": [
            {
                "display": "flex"
            },
            null
            ],
            headerShown: false
        }}
    >
        <BottomTab.Screen component={HomeStack} name="Home" 
            options={{
                tabBarIcon:({color}) => (
                    <Entypo name="home" color={color} size={20} />
                )
            }}
        />
        <BottomTab.Screen component={HomeStack} name="Categories" 
            options={{
                tabBarIcon:({color}) => (
                    <Ionicons name="list-circle" color={color} size={22} />
                )
            }}
        />
        <BottomTab.Screen component={AddProductScreen} name="Sell" 
            options={{
                tabBarIcon:({color}) => (
                    <Ionicons name="add-circle-sharp" color={color} size={22} />
                )
            }}
        />
        <BottomTab.Screen component={SavedItemsScreen} name="Saved" 
            options={{
                tabBarIcon:({color}) => (
                    <Ionicons name="star" size={22} color={color} />
                )
            }}
        />
        <BottomTab.Screen component={ProfileScreen} name="Profile" 
            options={{
                tabBarIcon:({color}) => (
                    <Entypo name="user" color={color} size={20} />
                )
            }}
        />
      </BottomTab.Navigator>
    </NavigationContainer>
  )
}

export default BottomTabsNavigator;