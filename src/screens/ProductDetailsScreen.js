import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  useWindowDimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import React from 'react';
import products from '../assets/data/products';

const ProductDetailsScreen = () => {
  const product = products[0];
  const {width} = useWindowDimensions();
  return (
    <View>
      <ScrollView>
        <FlatList
          data={product.images}
          renderItem={({item}) => (
            <Image source={{uri: item}} style={[styles.image, {width}]} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
        />
        <View style={{padding: 20}}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>Kshs. {product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Add to cart</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    aspectRatio: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '500',
    marginVertical: 10,
  },
  price: {
    fontWeight: '500',
    fontSize: 16,
  },
  description: {
    marginVertical: 10,
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '300',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#000',
    alignSelf: 'center',
    width: '90%',
    padding: 20,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 20,
  },
});
export default ProductDetailsScreen;
