import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const AddProductScreen = () => {
  return (
    <View style={styles.mainContainer}>
      <Text style={styles.text}>AddProductScreen</Text>
    </View>
  )
}

export default AddProductScreen

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