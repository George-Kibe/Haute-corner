import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, PermissionsAndroid } from 'react-native';
import { launchCamera } from 'react-native-image-picker';

const ProfileScreen = () => {
  const [cameraPhoto, setCameraPhoto] = useState()

  const options = {
    saveToPhotos: true,
    mediaType: "photo",
  }
  const openCamera = async() => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      const result = await launchCamera(options);
      console.log("Camera Result:",result)
      setCameraPhoto(result.assets[0].uri)
    }
  }
  const openGallery = () => {

  }

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity onPress={openCamera} style={styles.button}>
        <Text styles={styles.buttonText}>Open Camera</Text>
      </TouchableOpacity>
      {
        cameraPhoto && <Image style={styles.image} source={{uri:cameraPhoto}} />
      }
      <TouchableOpacity onPress={openGallery} style={styles.button}>
        <Text styles={styles.buttonText}>Open Gallery</Text>
      </TouchableOpacity>
    </View>
  )
}
export default ProfileScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    button: {
        backgroundColor: "#e7e7e7",
        borderWidth: 1,
        borderColor: "#6b6b6b",
        marginVertical:5,
        padding: 10,
        borderRadius:10,
    },
    buttonText: {
      color: "#000"
    },
    image: {
      width: 50,
      height: 50,
    }
})