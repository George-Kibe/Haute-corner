import React, {useState} from 'react';
import {Text, StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Pressable} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from "react-native-vector-icons/Ionicons"
const AddProductScreen = () => {
  const [title, setTitle] = useState();
  const [description, setDescription] = useState();
  const [category, setCategory] = useState();
  // const [image, setImage] = useState();
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState([]);
  const [price, setPrice] = useState();

  const goSetOptions = (text) => {
    const options = text.split(",");
    setOptions(options)
  } 
  // console.log("Options", options)
  

  return (
    <ScrollView style={styles.mainContainer}>
      <Text style={styles.title}> Add Product Details</Text>
      <View style={styles.inputView}>
        <Text style={styles.text}>Title:</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder='Title here' />
      </View>
      <View style={styles.inputView}>
        <Text style={styles.text}>Description:</Text>
        <TextInput	multiline={true} style={styles.input} 
          numberOfLines={3}
          onChangeText={(text) => setDescription(text)}
          placeholder='Product Description' 
          value={description}
        />
        <Text style={styles.text}>Category:</Text>
        <Picker
          selectedValue={category}
          onValueChange={currentcategory => setCategory(currentcategory)}>
          <Picker.Item label="Shoes" value="Shoes" />
          <Picker.Item label="Clothes" value="Clothes" />
          <Picker.Item label="Men" value="For Men" />
          <Picker.Item label="Women" value="For Women" />
          <Picker.Item label="Children" value="For Children" />
        </Picker>
        <Text>Selected: {category? category: "None"}</Text>
      </View>
      <View style={styles.inputView}>
        <Text style={styles.text}>Price:</Text>
        <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" style={styles.input} placeholder='Price' />
      </View>
      <View style={styles.inputView}>
        <Text style={styles.text}>Options:</Text>
        <TextInput onChangeText={(text) => goSetOptions(text)} style={styles.input} placeholder='Options Separate Options with ,' />
      </View>
      <View style={styles.inputView}>
        <Text style={styles.text}>Images:</Text>
        <View>
          <Pressable><Ionicons name='cloud-upload' size={25} /></Pressable>
        </View>
      </View>
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveText}>Save Product</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default AddProductScreen

const styles = StyleSheet.create({
    mainContainer: {
      padding: "10%",
    },
    title: {
      color: "black",
      alignSelf: "flex-start",
      fontWeight: "bold",
      fontSize: 20,
      alignSelf: "center",
      letterSpacing: 1
    },
    text: {
        color: "#000"
    },
    inputView: {
      width: "100%",
      marginTop: 5
    },
    input: {
      backgroundColor: "#e5e7eb",
      color: "#000",
      marginTop: 10,
      borderRadius: 10,
      padding: 10,
      fontSize: 15,
    },
    saveButton: {
      marginTop: 70,
      width: "100%",
      backgroundColor: "black",
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center"
    },
    saveText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 18
    }
})