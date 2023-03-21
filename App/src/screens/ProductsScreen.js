import {View, Image, FlatList, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {productsSlice} from '../store/productsSlice';
import { useGetProductsQuery } from '../store/apiSlice';
import IonIcons from "react-native-vector-icons/Ionicons"
const ProductsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const [category, setCategory] = useState("")
  //const products = useSelector(state => state.products.products);
  const {data, isLoading, error} = useGetProductsQuery();
  //console.log(data, isLoading,error)
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
      <View style={styles.categories}>
        <Text style={styles.text}>Choose Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryOptions}>
          <Pressable onPress={() => setCategory("Shoes")} style={[styles.categoryButton, {backgroundColor: category==="Shoes"? "#000": "#6B6B6B"}]}><Text style={styles.buttonText}>Shoes</Text></Pressable>
          <Pressable onPress={() => setCategory("Clothes")} style={[styles.categoryButton, {backgroundColor: category==="Clothes"? "#000": "#6B6B6B"}]}><Text style={styles.buttonText}>Clothes</Text></Pressable>
          <Pressable onPress={() => setCategory("Men")} style={[styles.categoryButton, {backgroundColor: category==="Men"? "#000": "#6B6B6B"}]}><Text style={styles.buttonText}>For Men</Text></Pressable>
          <Pressable onPress={() => setCategory("Women")} style={[styles.categoryButton, {backgroundColor: category==="Women"? "#000": "#6B6B6B"}]}><Text style={styles.buttonText}>For Women</Text></Pressable>
          <Pressable onPress={() => setCategory("Children")} style={[styles.categoryButton, {backgroundColor: category==="Children"? "#000": "#6B6B6B"}]}><Text style={styles.buttonText}>For Children</Text></Pressable>
        </ScrollView>
      </View>
      <FlatList
        data={products}
        renderItem={({item}) => (
          <Pressable
            onPress={() => {
              //dispatch(productsSlice.actions.setSelectedProduct(item.id));
              navigation.navigate('Product-Details', {"id": item._id});
            }}
            style={styles.itemContainer}>
            <IonIcons style={styles.likeIcon} name="star" size={20} color={"gray"} />
            <Image source={{uri: item.image}} style={styles.image} />
            <Text style={styles.itemText}>{item.name}</Text>
          </Pressable>
        )}
        numColumns={2}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e7e7e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categories: {
    display: 'flex',
    width: "100%",
    borderRadius: 20
  },
  categoryButton: {
    alignItems: 'center',
    margin: 10,
    paddingVertical: 1,
    borderRadius: 50,
    flexDirection: "row",
  }, 
  buttonText: {
    fontWeight: '500',
    marginHorizontal: 8,
    fontSize: 15,
    color: '#fff',
  },
  itemContainer: {
    width: '50%',
    padding: 1,
    alignItems: "center",
    position: 'relative'
  },
  text: {
    color: "#000",
   fontWeight: "bold",
    margin: 5
  },
  image: {
    width: '100%',
    borderRadius:10,
    aspectRatio: 1,
  },
  likeIcon: {
    position: 'absolute',
    zIndex: 1,
    right: 8,
    top: 8
  },
  itemText: {
    color: "#000",
    bottom: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    position: 'absolute',
    backgroundColor: "#e7e7e7",
    margin: "auto"

  }
});

export default ProductsScreen;
