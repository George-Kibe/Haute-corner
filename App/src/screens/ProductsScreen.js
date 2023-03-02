import {View, Image, FlatList, Text, StyleSheet, Pressable, ActivityIndicator} from 'react-native';
import React, {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {productsSlice} from '../store/productsSlice';
import { useGetProductsQuery } from '../store/apiSlice';

const ProductsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  //const products = useSelector(state => state.products.products);
  const {data, isLoading, error} = useGetProductsQuery();
  console.log(data, isLoading,error)
  const products = data?.data;

  if(isLoading){
    return <ActivityIndicator />
  }
  if(error){
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Error Fetching Products! {error.error}</Text>
      </View>
    )
  }  

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={({item}) => (
          <Pressable
            onPress={() => {
              dispatch(productsSlice.actions.setSelectedProduct(item.id));
              navigation.navigate('Product-Details');
            }}
            style={styles.itemContainer}>
            <Image source={{uri: item.image}} style={styles.image} />
          </Pressable>
        )}
        numColumns={2}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    width: '50%',
    padding: 1,
  },
  text: {
    color: "#000"
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
});

export default ProductsScreen;
