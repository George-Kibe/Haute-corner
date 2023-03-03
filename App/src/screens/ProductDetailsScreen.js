import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  useWindowDimensions,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {cartSlice} from '../store/cartSlice';
import { useGetProductQuery } from '../store/apiSlice';

const ProductDetailsScreen = ({navigation, route}) => {
  const {id} = route.params;
  const {data, isLoading, error} = useGetProductQuery(id);
  //console.log(data, isLoading,error)
  
  //const product = useSelector(state => state.products.selectedProduct);
  const dispatch = useDispatch();
  const {width} = useWindowDimensions();
  const addToCart = () => {
    dispatch(cartSlice.actions.addCartItem({product}));
  };
  
  if (isLoading){
    return <ActivityIndicator />
  }
  if(error){
    return <Text style={{color: "#000"}}>Error Fetching the Product. {error.error}</Text>
  }
  const product = data?.data;
  

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
        <View style={{padding: 20, backgroundColor: '#fff'}}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>Kshs. {product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <Pressable style={styles.button} onPress={addToCart}>
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
    color: '#000',
  },
  price: {
    fontWeight: '500',
    fontSize: 16,
    color: '#000',
  },
  description: {
    marginVertical: 10,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '300',
    color: 'gray',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#000',
    alignSelf: 'center',
    width: '90%',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 20,
    color: '#fff',
  },
});
export default ProductDetailsScreen;
