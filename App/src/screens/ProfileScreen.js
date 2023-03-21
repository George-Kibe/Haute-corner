import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
// import { launchCamera } from 'react-native-image-picker';
import DocumentPicker from "react-native-document-picker";

import { encode } from 'base-64';

const ProfileScreen = () => {
 const [imagesList, setImagesList] = useState([]);
  const docPicker = async() => {
   // Pick a multiple file
   try {
     const res = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.allFiles],
     });
     console.log("Response", res)
     console.log(
       JSON.stringify(res),
       res.uri,
       res.type, // mime type
       res.name,
       res.size
     );
     //this.uploadAPICall(res);//here you can call your API and send the data to that API
   } catch (err) {
     if (DocumentPicker.isCancel(err)) {
       console.log("error -----", err);
     } else {
       throw err;
     }
   }
 }

  console.log(imagesList)
  return (
    <View>
      <Button title="Capture Image" />
      <Text>Images</Text>
      {imagesList.length > 0 && imagesList.map((image, index) => (
        <Image key={index} source={{ uri: image }} style={{ width: 200, height: 200 }} />
      ))}
       <View
        style={{
            width: "30%",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>docPicker()}
            style={styles.uploadView}
          >
            {/* <Image
              source={images.upload}
              style={styles.documentStatusImg}
            /> */}
          <Text style={styles.uploadTxt}> {'upload  doc'}</Text>
          </TouchableOpacity>
        </View>
      <Text>Extra Image</Text>
      {/* <Image source={img} style={{ width: 200, height: 200 }} /> */}
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