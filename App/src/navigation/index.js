/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Pressable, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import ShoppingCartScreen from '../screens/ShoppingCartScreen';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useSelector} from 'react-redux';
import {selectedNumberOfItems} from '../store/cartSlice';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const numberOfItems = useSelector(selectedNumberOfItems);

  const HRight = ({navigation}) => (
    <Pressable
      onPress={() => navigation.navigate('Shopping-Cart')}
      style={{flexDirection: 'row', padding: 10}}>
      <FontAwesome5 name="shopping-cart" size={18} color="orange" />
      <Text style={{marginLeft: 5, fontWeight: '500', color: '#000'}}>
        {numberOfItems}
      </Text>
    </Pressable>
  )
  return (
    <NavigationContainer>
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
        <Stack.Screen name="Shopping-Cart" component={ShoppingCartScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
