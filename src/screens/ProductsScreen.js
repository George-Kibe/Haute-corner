import {View, Image, FlatList, StyleSheet, Pressable} from 'react-native';
import React from 'react';
//import products from '../assets/data/products';
import {useSelector, useDispatch} from 'react-redux';
import {productsSlice} from '../store/productsSlice';

const ProductsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const products = useSelector(state => state.products.products);
  const goToProductDetails = id => {
    //update selected Product
    dispatch(productsSlice.actions.setSelectedProduct(id));
    navigation.navigate('Product-Details');
  };

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
  image: {
    width: '100%',
    aspectRatio: 1,
  },
});

export default ProductsScreen;
