import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  Dimensions,
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
import Toast from 'react-native-toast-message';
import IonIcons from "react-native-vector-icons/Ionicons";


const {width, height} = Dimensions.get("screen");

const ProductDetailsScreen = ({navigation, route}) => {
  const {id} = route.params;
  const {data:product, isLoading, error} = useGetProductQuery(id); 
  console.log("Product: ", product)
  const [selectedOption, setSelectedOption] = useState()
  const [liked, setLiked] = useState(false)

  const dispatch = useDispatch();
  const addToCart = () => {
    dispatch(cartSlice.actions.addCartItem({product}));
    Toast.show({
      type: 'success',
      text1: 'Product Added to Cart',
      text2: 'You can now go to Checkout 😃'
    });
    
  };

  const addToLikedItems = () => {
    //dispatch to state
    setLiked(!liked);
    if(liked){
      Toast.show({
        type: 'error',
        text1: 'Product removed from Likes',
        text2: 'This product is no longer one of your likes 😃'
      }); 
    }else{
      Toast.show({
        type: 'success',
        text1: 'Product Added to Likes',
        text2: 'You can now view this item in your liked Items😃'
      }); 
    }   
  }
  
  if (isLoading){
    return <ActivityIndicator />
  }
  if(error){
    return <Text style={{color: "#000"}}>Error Fetching the Product. {error.error}</Text>
  }

  const propertiesData = [];
  for (const key in product.properties) {
    if (product.properties.hasOwnProperty(key)) {
      const value = product.properties[key];
      propertiesData.push({ key, value });
    }
  }
  console.log("propertiesData: ", propertiesData)
  return (
    <View style={styles.container}>
      <ScrollView>
        <FlatList
          data={product.images}
          renderItem={({item}) => (
            <View style={{position: "relative"}}>
              <Image source={{uri: item}} style={[styles.image, {width}]} />
              <IonIcons onPress={addToLikedItems} style={styles.likeIcon} name="star" size={25} color={liked? "red":"gray"} />
              {
                product?.images?.length > 1 && <Text style={styles.imageText}>Slide to view more Images</Text>
              }
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={true}
          pagingEnabled
        />
        <View style={styles.pickerContainer}>
          <Text style={styles.option}>Properties:</Text>

          <Picker style={{backgroundColor: "#fff", color: "#000", flex:1}}
            selectedValue={selectedOption}
            onValueChange={(itemValue) => setSelectedOption(itemValue)}
          >
            {
              propertiesData?.length > 0 && propertiesData?.map((prop) => (<Picker.Item label={prop.value} value={prop.value} key={prop.value}/>))
            }
          </Picker>
        </View>
        
        <View style={{paddingHorizontal: 20, backgroundColor: '#fff', marginBottom: 50}}>
          <Text style={styles.title}>{product.title}</Text>
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
  container:{
    minHeight: height,
  },
  image: {
    aspectRatio: 1,
  },
  likeIcon: {
    position: 'absolute',
    zIndex: 1,
    right: 20,
    top: 20
  },
  imageText: {
    color: "#b0adac",
    position: 'absolute',
    alignSelf: "center",
    fontSize: 18,
    bottom: 10,
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
    bottom: 200,
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
    marginLeft: 5,
    fontSize: 20,
    color: '#fff',
  },
});
export default ProductDetailsScreen;
