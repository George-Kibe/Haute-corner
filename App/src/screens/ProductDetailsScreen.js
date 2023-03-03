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
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {cartSlice} from '../store/cartSlice';
import { useGetProductQuery } from '../store/apiSlice';
import { Picker } from '@react-native-picker/picker'
import Ionicons from "react-native-vector-icons/Ionicons"
import { ToastAndroid } from 'react-native';
import Toast from 'react-native-toast-message';

const ProductDetailsScreen = ({navigation, route}) => {
  const {id} = route.params;
  const {data, isLoading, error} = useGetProductQuery(id);
  //console.log(data, isLoading,error)
  const product = data?.data;  
  const [selectedOption, setSelectedOption] = useState(product?.sizes[0])
  console.log(selectedOption)
  //const product = useSelector(state => state.products.selectedProduct);
  const dispatch = useDispatch();
  const {width} = useWindowDimensions();
  const addToCart = () => {
    dispatch(cartSlice.actions.addCartItem({product}));
    ToastAndroid.showWithGravity(
      "Added to Cart",
        ToastAndroid.LONG,
        ToastAndroid.CENTER
    );
    
    Toast.show({
      type: 'error',
      text1: 'Product Added to Cart',
      text2: 'You can now go to Checkout 😃'
    });
    
  };
  
  if (isLoading){
    return <ActivityIndicator />
  }
  if(error){
    return <Text style={{color: "#000"}}>Error Fetching the Product. {error.error}</Text>
  }
  console.log(product)
  
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
        <View style={styles.pickerContainer}>
          <Text style={styles.option}>Size/Option:</Text>

          <Picker style={{backgroundColor: "#fff", color: "#000", flex:1}}
            selectedValue={selectedOption}
            onValueChange={(itemValue) => setSelectedOption(itemValue)}
          >
            {
              product.sizes?.map((option) => (<Picker.Item label={option.toString()} value={option} key={option}/>))
            }
          </Picker>
        </View>
        
        <View style={{paddingHorizontal: 20, backgroundColor: '#fff', marginBottom: 50}}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>Kshs. {product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <Pressable style={styles.button} onPress={addToCart}>
        <Ionicons name="cart" size={20} color={"#fff"} />
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
    marginVertical: 5,
    color: '#000',
  },
  pickerContainer: {
    alignItems:"center",
    display: "flex",
    flexDirection: "row",
    paddingHorizontal: 20
  },
  price: {
    fontWeight: '500',
    fontSize: 16,
    color: '#000',
  },
  option: {
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
    width: '80%',
    padding: 10,
    borderRadius: 50,
    paddingHorizontal:50,
    alignItems: 'center',
    flexDirection: "row",
  },
  buttonText: {
    fontWeight: '500',
    marginLeft:30,
    fontSize: 20,
    color: '#fff',
  },
});
export default ProductDetailsScreen;
