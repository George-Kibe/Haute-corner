import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Text } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { encode } from 'base-64';

const ProfileScreen = () => {
  const img = "data:image/jpeg;base64,ZmlsZTovLy9kYXRhL3VzZXIvMC9jb20ubmlrZWFwcC9jYWNoZS9ybl9pbWFnZV9waWNrZXJfbGliX3RlbXBfOWZmMGM1YTctYjM4YS00N2Q5LTg1MzYtZDFlZTVhNmJiZGUwLmpwZw=="
  const [imagesList, setImagesList] = useState([]);

  const handleCapture = () => {
    launchCamera(
      {
        mediaType: 'photo',
        saveToPhotos: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          const imageData = response.assets[0];
          const base64 = `data:${imageData.type};base64,${encode(imageData.uri)}`;
          setImagesList([...imagesList, base64]);
        }
      },
    );
  };
  console.log(imagesList)
  return (
    <View>
      <Button title="Capture Image" onPress={handleCapture} />
      <Text>Images</Text>
      {imagesList.length > 0 && imagesList.map((image, index) => (
        <Image key={index} source={{ uri: image }} style={{ width: 200, height: 200 }} />
      ))}
      <Text>Extra Image</Text>
      <Image source={img} style={{ width: 200, height: 200 }} />
    </View>
    
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    text: {
        color: "#000"
    },
})