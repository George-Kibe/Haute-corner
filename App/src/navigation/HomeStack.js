/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
//screens imports
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import ShoppingCartScreen from '../screens/ShoppingCartScreen';
import TrackOrderScreen from '../screens/TrackOrderScreen';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import {useSelector} from 'react-redux';
import {selectedNumberOfItems} from '../store/cartSlice';


const Stack = createNativeStackNavigator();

const HomeStack = () => {
  const numberOfItems = useSelector(selectedNumberOfItems);
  const TrackOrder = ({navigation}) => (
    <Pressable
        onPress={() => navigation.navigate('Track-Order')}
        style={{flexDirection: 'row', padding: 10}}>
        <View style={{alignItems:"center"}}>
          <MaterialCommunityIcons name="truck-delivery" size={18} color="orange" />
          <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
            Track Order
          </Text>
        </View>
      </Pressable>
  )

  const HRight = ({navigation}) => (
    <View style={{flexDirection: 'row', alignItems: "center"}}>
      <Pressable
        onPress={() => navigation.navigate('Track-Order')}
        style={{flexDirection: 'row', padding: 0}}>
        <View style={{alignItems:"center"}}>
          <MaterialCommunityIcons name="truck-delivery" size={22} color="orange" />
          <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
            Track Order
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate('Shopping-Cart')}
        style={{flexDirection: 'row', padding: 10}}>
          <View style={{alignItems:"center", position:"relative"}}>
          <FontAwesome5 name="shopping-cart" size={18} color="orange" />
            <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
                My Cart
              </Text>
            <Text style={{right:10, top:-8, fontSize:16,fontWeight: 'bold', color: '#000', position:"absolute"}}>
              {numberOfItems}
            </Text>
          </View>
      </Pressable>
    </View>
    
  )
  return (
    <>
      <Stack.Navigator
        screenOptions={{contentStyle: {backgroundColor: 'white'}}}>
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={({navigation}) => ({
            headerRight: () => <HRight navigation={navigation} />,            
          })}
        />
        <Stack.Screen
          name="Product-Details"
          component={ProductDetailsScreen}
          options={({navigation}) => ({
            headerRight: () => <HRight navigation={navigation} />,
            presentation: "modal",
          })}
        />
        <Stack.Screen
          name="Shopping-Cart" 
          component={ShoppingCartScreen}
          options={({navigation}) => ({
            headerRight: () => <TrackOrder navigation={navigation} />,
          })}
        />
        <Stack.Screen name="Track-Order" component={TrackOrderScreen} />
      </Stack.Navigator>
    </>
  );
};

export default HomeStack;
