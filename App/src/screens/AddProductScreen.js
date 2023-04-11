import React, {useState} from 'react';
import {Text, StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Pressable, Image} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from "react-native-vector-icons/Ionicons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uploadImageToS3 from "../utils/UploadToS3"
import Toast from 'react-native-toast-message';
import axios from "axios"
axios.defaults.baseURL = "https://us-central1-airbnb-clone-55b31.cloudfunctions.net/app/";

const AddProductScreen = () => {
  const [title, setTitle] = useState();
  const [description, setDescription] = useState();
  const [category, setCategory] = useState();
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState([]);
  const [price, setPrice] = useState();

  const imageOptions = {
    saveToPhotos: true,
    mediaType: "photo",
    selectionLimit: 10,
  }

  const goSetOptions = (text) => {
    const options = text.split(",");
    setOptions(options)
  } 
  // console.log("Options", options)
  const openGallery = async() => {
    try {
      const result = await launchImageLibrary(imageOptions);
      const {assets} = result;
      const uploadedFiles = [];
      console.log(assets)
      for (let i = 0; i < assets.length; i++) {
        //console.log(req.files[i])
        const {uri:url, fileName, type: mimetype} = assets[i]
        const parts = fileName.split(".");
        const ext = parts[parts.length-1];
        const uploadUrl = await uploadImageToS3(url, mimetype, ext);
        uploadedFiles.push(uploadUrl)
      }
      console.log("Uploaded Files: ",uploadedFiles)
      setImages(prev => {
        return prev? [...prev, ...uploadedFiles] : [...uploadedFiles]
      }); 
    } catch (error) {
      console.warn(error.message)
    }
  }
  const makeFavorite = () => {

  }
  const deleteImage = (image) => {
    setImages(images.filter(img => img != image))
    Toast.show({
      type: 'success',
      text1: 'Image Removed',
      text2: 'Image Removed from product Images😃'
    }); 
  }
  // console.log(images)
  const saveProduct = async() => {
    if (!title|| !description || !category|| !options.length || !images.length || !price){
      //toast message
      Toast.show({
        type: 'error',
        text1: 'Missing Product Details. Fill Before you can Proceed!',
        text2: 'Some details are Missing. Correct and proceed'
      }); 
      return;
    }
    const data = {title, description, category, options, image:images[0], images, price}
    // console.log(data);
    //call saving to database API
    try {
      const response =await axios.post("products/new", data)
      console.log(response.data)
      console.log(response.status)
      if(response.status === 201){
        setTitle(""); setDescription(""); setImages([]); setOptions([]); setCategory(""); setPrice("")
        Toast.show({
          type: 'success',
          text1: 'Product successfully Added',
          text2: 'You can nowview it under the products screen😃'
        }); 
      }
    } catch (error) {
      console.log(error)
      Toast.show({
        type: 'error',
        text1: `Sorry, some error occured! ${error.message}`,
        text2: 'Please try Again!'
      }); 
    }
  }  

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
        <Text style={styles.text}>Add Images:</Text>
      </View>
      <View>
        <ScrollView style={styles.imagesContainer} horizontal>
        {
          images.length > 0 && images.map((image, index) => (
            <View style={{position: "relative"}} key={index} >
              <Image style={styles.image} source={{uri: image}}  />
              <MaterialCommunityIcons onPress={(image) => deleteImage(image)} style={styles.imageIconRight} name='delete' size={20} color="black" />
              <Ionicons  onPress={makeFavorite} style={styles.imageIconLeft} name='star' size={20} color={index===0? "red":"gray"} />
            </View>            
          ))
        }
        </ScrollView>         
       
        <Pressable onPress={openGallery}><Ionicons name='cloud-upload' size={35} /></Pressable>
      </View>      
      <TouchableOpacity style={styles.saveButton} onPress={saveProduct} >
        <Text style={styles.saveText}>Save Product</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default AddProductScreen

const styles = StyleSheet.create({
    mainContainer: {
      padding: "5%",
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
        color: "#000",
        fontWeight: "600"
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
    imagesContainer: {
      display: "flex",
      flexDirection: "row",
      width: "100%"
    },
    saveButton: {
      marginTop: 10,
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
    },
    image: {
      width: 100,
      margin: 2,
      height: 100,
      borderRadius: 5
    },
    imageIconRight: {
      position: "absolute",
      right: 5,
      bottom: 5,
    },
    imageIconLeft: {
      position: "absolute",
      left: 5,
      bottom: 5,
    }

})