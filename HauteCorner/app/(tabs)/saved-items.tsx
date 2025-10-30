import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { images } from '@/constants';

const SavedItemsScreen = () => {
  const [amount, setAmount] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState<string>("")

  console.log(amount)
  return (
    <View style={styles.mainContainer}>
      <View style={styles.card}>
        <Text style={styles.username}>George Test Kibe</Text>
        <Text style={styles.cardNumber}>4563 2637 1910 2728</Text>
      </View>
      <View style={styles.select}>
        <Text style={styles.selectText}>Select Payment Method</Text>
      </View>
      <View style={styles.paymentImages}>
        <View style={styles.imageContainer}> 
          <Image style={styles.image} source={images.MpesaLogo} />
        </View>
        <Image style={styles.image} source={images.MasterCardImage} />
        <Image style={styles.image} source={images.PaypalLogo} />
      </View>
      <View style={styles.inputView}>
        <Text style={styles.text}>Phone Number</Text>
        <TextInput value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} keyboardType='numeric' placeholder='Enter Phone Number' />
      </View>
      <View style={styles.inputView}>
        <Text style={styles.text}>Amount</Text>
        <TextInput value={amount.toString()} onChangeText={amount => setAmount(Number(amount) || 0)} style={styles.input} keyboardType='numeric' placeholder='Enter Amount' />
      </View>
      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payText}>Pay Now {amount}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default SavedItemsScreen

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    text: {
        color: "#000"
    },
    card: {
      backgroundColor: "black",
      padding:40,
      width: "90%",
      height: 150,
      borderRadius: 10,
      justifyContent: "flex-start",
      alignItems: "flex-start"
    },
    username: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
      fontFamily: "sans-serif",
      letterSpacing: 1
    },
    cardNumber: {
      color: "orange",
      marginTop: 10,
    },
    select: {
      justifyContent: 'flex-start',
      alignItems: "flex-start",
      marginVertical: 10,
      width: "70%"
    },
    selectText: {
      color: "black",
      alignSelf: "flex-start",
      fontWeight: "bold",
      fontSize: 15,
      letterSpacing: 1
    },
    imageContainer: {
      width: 80, 
      height: 50,
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor: "black",
      borderRadius: 10
    },
    paymentImages: {
      width: "60%",
      justifyContent: 'space-between',
      alignItems: "center",
      display: "flex",
      flexDirection: "row"
    },
    image: {
      width: 50,
      height: 50,
      aspectRatio: 4 / 3,
      resizeMode: "contain"
    },
    inputView: {
      width: "80%",
      marginTop: 20
    },
    input: {
      backgroundColor: "#e5e7eb",
      color: "#000",
      height: 40,
      marginTop: 10,
      borderRadius: 10,
      padding: 10,
      fontSize: 15,
    },
    payButton: {
      marginTop: 70,
      width: "80%",
      backgroundColor: "black",
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center"
    },
    payText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 18
    }
})