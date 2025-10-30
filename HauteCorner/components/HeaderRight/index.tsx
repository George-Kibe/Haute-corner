import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

const numberOfItems = 1;

export const TrackOrder = () => (
    <Pressable
      onPress={() => router.push('/track-order')}
      style={{flexDirection: 'row', padding: 10}}>
      <View style={{alignItems:"center"}}>
        <MaterialCommunityIcons name="truck-delivery" size={18} color="orange" />
        <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
          Track Order
        </Text>
      </View>
    </Pressable>
  )
export const MyCart = () => (
    <Pressable
      onPress={() => router.push('/shopping-cart')}
      style={{flexDirection: 'row', padding: 10}}>
        <View style={{alignItems:"center", position:"relative"}}>
        <FontAwesome5 name="shopping-cart" size={18} color="orange" />
          <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
            My Cart
          </Text>
          <Text style={{right:10, top:-8, fontSize:16,fontWeight: 'bold', color: '#000', position:"absolute"}}>
            {numberOfItems}
          </Text>
        </View>
    </Pressable>
  )
export  const HRight = () => (
    <View style={{flexDirection: 'row', alignItems: "center"}}>
      <Pressable
        onPress={() => router.push('/modal')}
        style={{flexDirection: 'row', padding: 0}}>
        <View style={{alignItems:"center"}}>
          <MaterialCommunityIcons name="truck-delivery" size={22} color="orange" />
          <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
            Track Order
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push('/shopping-cart')}
        style={{flexDirection: 'row', padding: 10}}>
          <View style={{alignItems:"center", position:"relative"}}>
          <FontAwesome5 name="shopping-cart" size={18} color="orange" />
            <Text style={{fontWeight: '500', color: '#000', fontSize: 10}}>
              My Cart
            </Text>
            <Text style={{right:10, top:-8, fontSize:16,fontWeight: 'bold', color: '#000', position:"absolute"}}>
              {numberOfItems}
            </Text>
          </View>
      </Pressable>
    </View>
  )