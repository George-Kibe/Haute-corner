import { StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText as Text } from '@/components/app-text'
import { SignInRequired } from '@/features/auth/sign-in-required';
import React, {useState} from 'react'
import { useGetOrderQuery } from '@/store/apiSlice'

const TrackOrderScreen = () => {
  const [ref, setRef] = useState("")

  const {data, isLoading, error} = useGetOrderQuery(ref);

  return (
    <SafeAreaView edges={['bottom']} style={styles.root}>
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
    </SafeAreaView>
  )
}

// Replaced in a later phase; until then it is only shown to signed-in users.
export default function TrackOrderScreenGate() {
  return (
    <SignInRequired title="Track your orders" message="Sign in to see your orders and where they are.">
      <TrackOrderScreen />
    </SignInRequired>
  );
};

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
  orderContainer: {
    width: "100%",
    padding: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
  },
  input: {
    borderColor: "#000",
    color: "#000",
    borderWidth: 1,
    padding:10,
    backgroundColor: "#e5e7eb",
    height: 40,
    borderRadius: 10,
  }
})