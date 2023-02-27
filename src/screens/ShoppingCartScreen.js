/* eslint-disable react/no-unstable-nested-components */
import {FlatList, StyleSheet, Text, View, Pressable} from 'react-native';
import React from 'react';
import cart from '../assets/data/cart';
import CartListItem from '../components/CartListItem';

const ShoppingCartScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        renderItem={({item}) => <CartListItem cartItem={item} />}
        ListFooterComponent={() => (
          <View style={styles.totalsContainer}>
            <View style={styles.row}>
              <Text style={styles.text}>Subtotal:</Text>
              <Text style={styles.text}>Kshs. 45,640</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Delivery:</Text>
              <Text style={styles.text}>Kshs. 40</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.textBold}>Total:</Text>
              <Text style={styles.textBold}>Kshs. 45,680</Text>
            </View>
          </View>
        )}
      />

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Checkout</Text>
      </Pressable>
    </View>
  );
};

export default ShoppingCartScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    height: '100%',
  },
  totalsContainer: {
    margin: 20,
    paddingTop: 10,
    borderColor: 'gainsboro',
    borderTopWidth: 1,
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
  },
  button: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#000',
    alignSelf: 'center',
    width: '90%',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 20,
    color: '#fff',
  },
});
