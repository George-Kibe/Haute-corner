import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, PermissionsAndroid } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import uploadImageToS3 from '../utils/UploadToS3';

const ProfileScreen = () => {
  const [cameraPhoto, setCameraPhoto] = useState();
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const options = {
    saveToPhotos: true,
    // includeBase64: true,
    mediaType: "photo",
    selectionLimit: 10,
  }
  const openCamera = async() => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      try {
        const result = await launchCamera(options);
        console.log(result)
        const {uri:url, fileName, type: mimetype} = result.assets[0]
        const parts = fileName.split(".");
        const ext = parts[parts.length-1];
        const uploadUrl = await uploadImageToS3(url, mimetype, ext);
        uploadUrl && setCameraPhoto(uploadUrl) 
      } catch (error) {
        console.warn(error.message)
      }      
    }
  }
  const openGallery = async() => {
    try {
      const result = await launchImageLibrary(options);
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
      setGalleryPhotos(prev => {
        return prev? [...prev, ...uploadedFiles] : [...uploadedFiles]
      }); 
      
    } catch (error) {
      console.warn(error.message)
    }
  }
  // console.log(galleryPhotos)
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
      {
        galleryPhotos.length > 0 && <Image style={styles.image} source={{uri: galleryPhotos[0]}}  />
      }
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