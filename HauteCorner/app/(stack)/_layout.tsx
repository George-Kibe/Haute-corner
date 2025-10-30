
import { StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import Hleft from '@/components/HeaderLeft'

const StackLayout = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack>
        <Stack.Screen name="shopping-cart" options={{ headerShown: true, headerLeft:Hleft }} />
        <Stack.Screen name="track-order" options={{ headerShown: true, headerLeft:Hleft }} /> 
      </Stack>
    </SafeAreaView>
  )
}

export default StackLayout

const styles = StyleSheet.create({
    container: { flex: 1,  }
})