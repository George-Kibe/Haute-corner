import { StyleSheet, Text, View, TextInput, ScrollView, ActivityIndicator } from 'react-native'
import React, {useState, useEffect} from 'react'
import { useGetOrderQuery } from '../store/apiSlice'

const TrackOrderScreen = () => {
  const [ref, setRef] = useState("")

  const {data, isLoading, error} = useGetOrderQuery(ref);

  return (
    <View style={styles.root}>
      <TextInput 
        style={styles.input}
        value={ref}
        onChangeText={setRef}
        placeholder="Order Reference"
        maxLength={6}
      />
      { isLoading && <ActivityIndicator />}
      {data?.status !== "OK" && <Text style={styles.text}>Order Not Found</Text>}
      {data?.status === "OK" && (
        <ScrollView style={styles.orderContainer}>
          <Text>Items: {data.data.items.length}</Text>


          <Text style={styles.text}>{JSON.stringify(data.data, null, 2)}</Text>

        </ScrollView>
        
      )}
    </View>
  )
}

export default TrackOrderScreen;

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#fff",
    padding:10,
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  },
  text: {
    color: "#000"
  },
  input: {
    color: "#000",
    borderColor: "#e7e7e7",
    marginVertical:10,
    borderWidth: 1,
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
  }
})