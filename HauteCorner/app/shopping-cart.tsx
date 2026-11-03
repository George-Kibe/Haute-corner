import {FlatList, StyleSheet, View, Pressable, ActivityIndicator, Alert} from 'react-native';
import { useSession } from '@/features/auth/session';
import { openSignIn } from '@/features/auth/sign-in-required';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/app-text';
import { formatPrice } from '@/lib/format';
import React from 'react';
import CartListItem from '@/components/CartListItem';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectDeliveryPrice,
  selectSubtotal,
  selectTotal,
  cartSlice,
} from '@/store/cartSlice';
import { useCreateOrderMutation } from '@/store/apiSlice';
import { router } from 'expo-router';

const ShoppingCartTotals = () => {
  const subtotal = useSelector(selectSubtotal);
  const deliveryFee = useSelector(selectDeliveryPrice);
  const total = useSelector(selectTotal);

  return (
    <View style={styles.totalsContainer}>
      <View style={styles.row}>
        <Text style={styles.text}>Subtotal:</Text>
        <Text style={styles.text}>{formatPrice(subtotal)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>Delivery:</Text>
        <Text style={styles.text}>{formatPrice(deliveryFee)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.textBold}>Total:</Text>
        <Text style={styles.textBold}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
};

const ShoppingCartScreen = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: { cart: { items: any[] } }) => state.cart.items);
  // console.log(cartItems)
  const subtotal = useSelector(selectSubtotal);
  const deliveryFee = useSelector(selectDeliveryPrice);
  const total = useSelector(selectTotal);

  const [createOrder, {data, isLoading, error}] = useCreateOrderMutation();
  // console.log(data, isLoading, error)
  const onCheckoutClick = async() => {
    if (useSession.getState().status !== 'signedIn') {
      openSignIn();
      return;
    }
    const result = await createOrder({
      items: cartItems,
      subtotal,
      deliveryFee,
      total,
      customer:{
        name: "George Test",
        address: "Roysambu",
        email: "georgetest@gmail.com",
        phone: "0704817466"
      }
    })
    console.log("Ref",result.data.data.ref)

    if (result.data?.status === "Created!"){
      Alert.alert(
        'Order has been Submitted!',
        `Your oder reference is: ${result.data.data.ref}`
      );
      dispatch(cartSlice.actions.clearCart());
    }
  }
  if(!cartItems.length) {
    const goToProducts = () => {
      router.push("/categories")
    }
    return (
      <SafeAreaView edges={['bottom']} style={styles.noCartcontainer}>
        <Text style={{color: "#000"}}>Your Cart is Empty</Text>
        <Text style={{color: "#000"}}>Add some Items to Cart</Text>
        <Pressable style={styles.button} onPress={goToProducts} >
          <Text style={styles.buttonText}>Continue Shopping</Text>
        </Pressable>
      </SafeAreaView>
    )
  }
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={({item}) => <CartListItem cartItem={item} />}
        ListFooterComponent={ShoppingCartTotals}
      />

      <Pressable style={styles.button} onPress={onCheckoutClick}>
        <Text style={styles.buttonText}>
          Checkout
          {isLoading && <ActivityIndicator />}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default ShoppingCartScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    height: '100%'
  },
  noCartcontainer: {
    backgroundColor: '#fff',
    height: '100%',
    alignItems:"center",
    justifyContent:'center',
  },
  totalsContainer: {
    margin: 20,
    paddingTop: 10,
    borderColor: 'gainsboro',
    borderTopWidth: 1,
    marginBottom:70,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  text: {
    fontSize: 16,
    color: 'gray',
  },
  textBold: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#0E4BB4',
    alignSelf: 'center',
    width: '90%',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 20,
    color: '#fff',
  },
});
