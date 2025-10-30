import { Pressable, StyleSheet, View } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { FontAwesome5 } from '@expo/vector-icons'

const Hleft = () => {
  return (
    <Pressable
      onPress={() => router.push('/(tabs)')}>
      <View style={{alignItems:"center"}}>
        <FontAwesome5 name="chevron-circle-left" size={24} color="black" />
      </View>
    </Pressable>
  )
}

export default Hleft

const styles = StyleSheet.create({})