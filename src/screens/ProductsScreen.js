import {View, Image, FlatList, StyleSheet} from 'react-native';
import React from 'react';
import products from '../assets/data/products';

const ProductsScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={({item}) => (
          <View style={styles.itemContainer}>
            <Image source={{uri: item.image}} style={styles.image} />
          </View>
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
